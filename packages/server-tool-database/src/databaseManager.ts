import { Parser } from 'node-sql-parser';

import type { ButlerAi } from '@butler/server-ai';
import type { ToolDatabase } from './type';

export default class DatabaseManager {
  constructor(private options: ToolDatabase.Options) {}

  async getTables(
    context: ButlerAi.AiService.Context
  ): Promise<ToolDatabase.TableDesc[]> {
    return ((await this.options.getTable?.(context)) || []).filter(
      (table) => table.supportedActions.length > 0
    );
  }

  async getTableColumns(
    tableName: string,
    context: ButlerAi.AiService.Context
  ): Promise<ToolDatabase.TableColumnDesc[]> {
    return this.options.getTableColumns(tableName, context) || [];
  }

  async executeSql(sql: string, context: ButlerAi.AiService.Context) {
    const tableWithColumns = this.getTableAndColumnsFromSql(sql);

    const errorMessage = await this.checkPremission(tableWithColumns, context);
    if (errorMessage) {
      return errorMessage;
    }

    return await this.options.executeSql(sql, context);
  }

  private async checkPremission(
    tableWithColumns: ToolDatabase.ActionTableWithColumns[],
    context: ButlerAi.AiService.Context
  ) {
    const tables = await this.getTables(context);

    for (const item of tableWithColumns) {
      const table = tables.find((table) => table.name === item.table);
      if (!table || !table.supportedActions.includes(item.action)) {
        return `Not permitted to ${item.action} table ${item.table}`;
      }

      if (item.action === 'delete' || item.action === 'insert') {
        continue;
      }

      const columns =
        table.columns || (await this.getTableColumns(item.table, context));

      const needCheckColumns = item.columns || [];
      for (const needCheckColumn of needCheckColumns) {
        const column = columns.find(
          (column) => column.name === needCheckColumn
        );

        if (!column || !column.supportedActions.includes(item.action)) {
          return `Not permitted to ${item.action} column ${needCheckColumn} in table ${item.table}`;
        }
      }
    }
  }

  private getTableAndColumnsFromSql(sql: string) {
    const parser = new Parser();
    const { tableList, columnList } = parser.parse(sql, {
      database: this.options.databaseType,
    });

    const tableWithColumns: ToolDatabase.ActionTableWithColumns[] = [];

    tableList.forEach((item) => {
      const [action, _, table] = item.split('::');
      tableWithColumns.push({
        action:
          action.toLowerCase() as ToolDatabase.ActionTableWithColumns['action'],
        table,
        columns: [],
      });
    });

    columnList.forEach((item) => {
      const [action, table, column] = item.split('.');
      const tableWithColumn = tableWithColumns.find(
        (item) => item.table === table && item.action === action
      );
      if (tableWithColumn) {
        tableWithColumn.columns?.push(column);
      }
    });

    return tableWithColumns;
  }
}
