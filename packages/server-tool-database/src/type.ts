import { ButlerAi } from '@butler/server-ai';

export namespace ToolDatabase {
  export type DatabaseType =
    | 'MySQL'
    | 'Postgresql'
    | 'SQLite'
    | 'Oracle'
    | 'MariaDB';

  export type ActionType = 'select' | 'insert' | 'update' | 'delete';

  export interface TableDesc {
    name: string;
    supportedActions: ActionType[];
    description?: string;
    columns?: TableColumnDesc[];
  }

  export interface TableColumnDesc {
    name: string;
    supportedActions: Extract<ActionType, 'select' | 'update'>[];
    type: string;
    description?: string;
    [x: string]: any;
  }

  export interface ActionTableWithColumns {
    action: ActionType;
    table: string;
    columns?: string[];
  }

  export interface GetTable {
    (context: ButlerAi.AiService.Context): Promise<TableDesc[]>;
  }

  export interface GetTableColumns {
    (
      tableName: string,
      context: ButlerAi.AiService.Context
    ): Promise<TableColumnDesc[]>;
  }

  export interface ExecuteSql {
    (sql: string, context: ButlerAi.AiService.Context): Promise<any>;
  }

  export interface Options {
    databaseType: DatabaseType;
    getTable: GetTable;
    getTableColumns: GetTableColumns;
    executeSql: ExecuteSql;
  }
}
