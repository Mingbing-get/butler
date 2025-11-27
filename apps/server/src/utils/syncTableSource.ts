import { createDbMetaInstance, DbMeta } from '@ai-nucl/server-db-meta';

import db from '../db';
import {
  USER_TABLE_NAME,
  ROLE_TABLE_NAME,
  DATABASE_SOURCE_TABLE_NAME,
  API_SOURCE_TABLE_NAME,
} from '../consts';
import snowFlake from './snowFlake';

import { DatabaseSource } from '../type';

export default class SyncTableSource {
  static EXCLUDE_TABLES = [
    USER_TABLE_NAME,
    ROLE_TABLE_NAME,
    DATABASE_SOURCE_TABLE_NAME,
    API_SOURCE_TABLE_NAME,
  ];

  private dbMeta = createDbMetaInstance(db);

  async run() {
    const tables = await this.dbMeta.getTableNames();
    for (const tableInfo of tables) {
      await this.syncOnTable(tableInfo);
    }
  }

  private async syncOnTable(tableInfo: DbMeta.Table) {
    if (SyncTableSource.EXCLUDE_TABLES.includes(tableInfo.name)) {
      return;
    }

    const columns = await this.dbMeta.getTableColumns(tableInfo.name);

    const existingSources = await db<DatabaseSource>(DATABASE_SOURCE_TABLE_NAME)
      .where('tableName', '=', tableInfo.name)
      .select('id', 'columnName', 'type', 'extra', 'key', 'nullable');

    const willDeleteIds = existingSources
      .filter((item) => {
        if (!item.columnName) return false;

        return !columns.some((column) => column.name === item.columnName);
      })
      .map((item) => item.id);

    const willCreateRecords: DatabaseSource[] = [];
    const hasTableRecord = existingSources.some((item) => !item.columnName);
    if (!hasTableRecord) {
      willCreateRecords.push({
        id: snowFlake.next(),
        tableName: tableInfo.name,
        description: tableInfo.description,
      });
    }

    willCreateRecords.push(
      ...columns
        .filter(
          (column) =>
            !existingSources.some((item) => item.columnName === column.name)
        )
        .map((column) => ({
          id: snowFlake.next(),
          tableName: tableInfo.name,
          columnName: column.name,
          type: column.type,
          description: column.description,
          nullable: column.nullable,
          key: column.key,
          extra: column.extra,
        }))
    );

    const willUpdateRecords: (Pick<DatabaseSource, 'id'> &
      Partial<Omit<DatabaseSource, 'id'>>)[] = [];
    for (const source of existingSources) {
      if (!source.columnName) continue;

      const column = columns.find((item) => item.name === source.columnName);
      if (!column) continue;

      if (
        source.type !== column.type ||
        source.extra !== column.extra ||
        source.key !== column.key ||
        source.nullable !== column.nullable
      ) {
        willUpdateRecords.push({
          id: source.id,
          type: column.type,
          extra: column.extra,
          key: column.key,
          nullable: column.nullable,
        });
      }
    }

    await db.transaction(async (trx) => {
      if (willDeleteIds.length > 0) {
        await trx<DatabaseSource>(DATABASE_SOURCE_TABLE_NAME)
          .whereIn('id', willDeleteIds)
          .delete();
      }

      for (const record of willUpdateRecords) {
        await trx<DatabaseSource>(DATABASE_SOURCE_TABLE_NAME)
          .where('id', '=', record.id)
          .update(record);
      }

      if (willCreateRecords.length > 0) {
        await trx<DatabaseSource>(DATABASE_SOURCE_TABLE_NAME).insert(
          willCreateRecords
        );
      }
    });
  }
}
