import knex from 'knex';
import { DbMeta } from '../type';

export default class MySqlMetaInstance implements DbMeta.Instance {
  constructor(private db: knex.Knex) {}

  async getTableNames(): Promise<DbMeta.Table[]> {
    const result = await this.db.raw('SHOW TABLES');
    return result[0].map((row: any) => ({
      name: row[`Tables_in_${this.db.client.config.connection.database}`],
    }));
  }

  async getTableColumns(tableName: string): Promise<DbMeta.Column[]> {
    const result = await this.db.raw(`SHOW COLUMNS FROM \`${tableName}\``);
    return result[0].map((row: any) => ({
      name: row.Field,
      type: row.Type,
      isPrimaryKey: row.Key === 'PRI',
      isUnique: row.Key === 'UNI',
      isNullable: row.Null === 'YES',
      defaultValue: row.Default,
    }));
  }
}
