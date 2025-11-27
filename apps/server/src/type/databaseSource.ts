export interface DatabaseSource {
  id: number;
  description?: string;
  tableName: string;
  columnName?: string;
  type?: string;
  key?: string;
  nullable?: string;
  extra?: string;
}
