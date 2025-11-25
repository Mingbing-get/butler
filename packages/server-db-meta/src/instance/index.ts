import knex from 'knex';
import { DbMeta } from '../type';
import MySqlMeta from './mysqlMeta';
import PgSqlMeta from './pgsqlMeta';

export { MySqlMeta, PgSqlMeta };

export function createDbMetaInstance(db: knex.Knex): DbMeta.Instance {
  const client = db.client.config.client;
  switch (client) {
    case 'mysql':
    case 'mysql2':
      return new MySqlMeta(db);
    case 'pg':
    case 'postgresql':
      return new PgSqlMeta(db);
    default:
      throw new Error(`Unsupported database client: ${client}`);
  }
}
