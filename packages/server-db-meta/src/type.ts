export namespace DbMeta {
  export interface Table {
    name: string;
    description?: string;
  }

  export interface Column {
    name: string;
    description?: string;
    type: string;
    isPrimaryKey?: boolean;
    isUnique?: boolean;
    isNullable?: boolean;
    defaultValue?: string;
    references?: {
      table: string;
      column: string;
    };
  }

  export interface Instance {
    getTableNames(): Promise<Table[]>;
    getTableColumns(tableName: string): Promise<Column[]>;
  }
}
