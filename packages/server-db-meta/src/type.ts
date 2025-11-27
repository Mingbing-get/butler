export namespace DbMeta {
  export interface Table {
    name: string;
    description?: string;
  }

  export interface Column {
    name: string;
    description?: string;
    type: string;
    key?: string;
    nullable?: string;
    defaultValue?: string;
    extra?: string;
  }

  export interface Instance {
    getTableNames(): Promise<Table[]>;
    getTableColumns(tableName: string): Promise<Column[]>;
  }
}
