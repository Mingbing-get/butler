import { Parser } from 'node-sql-parser';

import type { AiNucl } from '@ai-nucl/server-ai';
import type { ToolDatabase } from './type';

export default class DatabaseManager {
  constructor(private options: ToolDatabase.Options) {}

  async getTables(
    context: AiNucl.AiService.Context
  ): Promise<ToolDatabase.TableDesc[]> {
    return ((await this.options.getTable?.(context)) || []).filter(
      (table) => table.supportedActions.length > 0
    );
  }

  async getTableColumns(
    tableName: string,
    context: AiNucl.AiService.Context
  ): Promise<ToolDatabase.TableColumnDesc[]> {
    return this.options.getTableColumns(tableName, context) || [];
  }

  async executeSql(sql: string, context: AiNucl.AiService.Context) {
    const tableWithColumns = this.getTableAndColumnsFromSql(sql);

    const errorMessage = await this.checkPremission(tableWithColumns, context);
    if (errorMessage) {
      return errorMessage;
    }

    return await this.options.executeSql(sql, context);
  }

  private async checkPremission(
    tableWithColumns: ToolDatabase.ActionTableWithColumns[],
    context: AiNucl.AiService.Context
  ) {
    const tables = await this.getTables(context);

    for (const item of tableWithColumns) {
      const table = tables.find((table) => table.name === item.table);
      if (!table) {
        return `Table ${item.table} not found`;
      }

      if (!table.supportedActions.includes(item.action)) {
        return `Not permitted to ${item.action} table ${item.table}`;
      }

      if (item.action === 'delete' || item.action === 'insert') {
        continue;
      }

      const needCheckColumns = item.columns || [];
      for (const needCheckColumn of needCheckColumns) {
        if (['*', '.*', '(.*)'].includes(needCheckColumn)) {
          return 'Not permitted to use * in columns';
        }
      }

      const columns =
        table.columns || (await this.getTableColumns(item.table, context));

      for (const needCheckColumn of needCheckColumns) {
        const column = columns.find(
          (column) => column.name === needCheckColumn
        );

        if (!column) {
          return `Column ${needCheckColumn} not found in table ${item.table}`;
        }

        if (!column.supportedActions.includes(item.action)) {
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
      const [action, table, column] = item.split('::');

      const tableWithColumn = tableWithColumns.find((item) => {
        if (item.action !== action) {
          return false;
        }

        return item.table === table || table === 'null';
      });

      if (tableWithColumn) {
        tableWithColumn.columns?.push(column);
      }
    });

    return tableWithColumns;
  }
}
