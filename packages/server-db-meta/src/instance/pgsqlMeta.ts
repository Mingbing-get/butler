import knex from 'knex';
import { DbMeta } from '../type';

export default class PgSqlMetaInstance implements DbMeta.Instance {
  constructor(private db: knex.Knex) {}

  async getTableNames(): Promise<DbMeta.Table[]> {
    const result = await this.db.raw(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    return result[0].map((row: any) => ({
      name: row.table_name,
    }));
  }

  async getTableColumns(tableName: string): Promise<DbMeta.Column[]> {
    const result = await this.db.raw(
      `SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = "${tableName}"`
    );
    return result[0].map((row: any) => ({
      name: row.column_name,
      type: row.data_type,
      isPrimaryKey: false, // PostgreSQL不支持PRI键，需要通过其他方式判断
      isUnique: row.is_nullable === 'NO',
      isNullable: row.is_nullable === 'YES',
      defaultValue: row.column_default,
    }));
  }
}
