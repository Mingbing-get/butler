import dotenv from 'dotenv';
import { Knex } from 'knex';

import { createDbMetaInstance, DbMeta } from '@ai-nucl/server-db-meta';

import snowFlake from '../utils/snowFlake';
import { encrypt } from '../utils/crypto';
import SyncTableSource from '../utils/syncTableSource';
import { User } from '../type';
import db from '../db';
import {
  USER_TABLE_NAME,
  ROLE_TABLE_NAME,
  DATABASE_SOURCE_TABLE_NAME,
  API_SOURCE_TABLE_NAME,
} from '../consts';

dotenv.config();

export async function initDb() {
  const dbMeta = createDbMetaInstance(db);
  const tables = await dbMeta.getTableNames();

  await initUserTable(tables);
  await initRoleTable(tables);
  await initDatabaseSourceTable(tables);
  await initApiSourceTable(tables);
}

async function initUserTable(tables: DbMeta.Table[]) {
  await syncTable({
    tables,
    tableName: USER_TABLE_NAME,
    fieldMap: {
      id: (table) => table.bigInteger('id').unsigned().primary(),
      name: (table) => table.string('name').unique(),
      nickName: (table) => table.string('nickName'),
      password: (table) => table.string('password'),
      status: (table) =>
        table
          .enum('status', ['active', 'inactive'])
          .notNullable()
          .defaultTo('active'),
    },
  });

  const firstUser = await db<User>(USER_TABLE_NAME).first();
  if (firstUser) return;

  const adminUserName = process.env.INIT_ADMIN_USERNAME;
  const adminPassword = process.env.INIT_ADMIN_PASSWORD;
  if (!adminUserName || !adminPassword) {
    throw new Error('INIT_ADMIN_USERNAME and INIT_ADMIN_PASSWORD are required');
  }

  await db<User>(USER_TABLE_NAME).insert({
    id: snowFlake.next(),
    name: adminUserName,
    nickName: adminUserName,
    password: encrypt(adminPassword),
    status: 'active',
  });
}

async function initRoleTable(tables: DbMeta.Table[]) {
  await syncTable({
    tables,
    tableName: ROLE_TABLE_NAME,
    fieldMap: {
      id: (table) => table.bigInteger('id').unsigned().primary(),
      name: (table) => table.string('name').unique(),
      description: (table) => table.string('description'),
      databaseSources: (table) => table.json('databaseSources'), // ['1::select:update','2::delete','3::insert']
      apiSources: (table) => table.json('apiSources'), // ['1','2','3']
      users: (table) => table.json('users'), // [1,2,3]
    },
  });
}

async function initDatabaseSourceTable(tables: DbMeta.Table[]) {
  await syncTable({
    tables,
    tableName: DATABASE_SOURCE_TABLE_NAME,
    fieldMap: {
      id: (table) => table.bigInteger('id').unsigned().primary(),
      description: (table) => table.string('description'),
      tableName: (table) => table.string('tableName').notNullable(),
      columnName: (table) => table.string('columnName'),
      type: (table) => table.string('type', 50),
      key: (table) => table.string('key', 50),
      nullable: (table) => table.string('nullable', 10),
      extra: (table) => table.text('extra'),
    },
  });

  const syncTableSource = new SyncTableSource();
  await syncTableSource.run();
}

async function initApiSourceTable(tables: DbMeta.Table[]) {
  await syncTable({
    tables,
    tableName: API_SOURCE_TABLE_NAME,
    fieldMap: {
      id: (table) => table.bigInteger('id').unsigned().primary(),
      description: (table) => table.string('description'),
      name: (table) => table.string('name').notNullable(),
    },
  });
}

interface Options {
  tables: DbMeta.Table[];
  tableName: string;
  fieldMap: Record<
    string,
    (table: Knex.CreateTableBuilder) => Knex.ColumnBuilder
  >;
}
async function syncTable({ tables, tableName, fieldMap }: Options) {
  const hasTable = tables.some((table) => table.name === tableName);
  if (!hasTable) {
    await db.schema.createTable(tableName, (table) => {
      Object.entries(fieldMap).forEach(([fieldName, fieldBuilder]) => {
        fieldBuilder(table);
      });
    });
  } else {
    const dbMeta = createDbMetaInstance(db);
    const columns = await dbMeta.getTableColumns(tableName);
    const columnNames = columns.map((column) => column.name);
    await db.schema.alterTable(tableName, (table) => {
      Object.entries(fieldMap).forEach(([fieldName, fieldBuilder]) => {
        if (!columnNames.includes(fieldName)) {
          fieldBuilder(table);
        }
      });

      columnNames.forEach((columnName) => {
        if (!Object.keys(fieldMap).includes(columnName)) {
          table.dropColumn(columnName);
        }
      });
    });
  }
}
