import { DatabaseManager, ToolDatabase } from '@ai-nucl/server-tool-database';

import { Role, DatabaseSource } from '../type';
import db from '../db';
import { ROLE_TABLE_NAME, DATABASE_SOURCE_TABLE_NAME } from '../consts';

async function getDataSourceWithActionWithRole(roleIds: number[]) {
  const roles = await db<Role>(ROLE_TABLE_NAME)
    .whereIn('id', roleIds)
    .select('databaseSources');

  const dataSourceWithAction: Record<string, ToolDatabase.ActionType[]> = {};

  roles.forEach((role) => {
    role.databaseSources?.forEach((source) => {
      const [tableId, actionStr] = source.split('::');
      const actions = actionStr.split(':') as ToolDatabase.ActionType[];
      if (!dataSourceWithAction[tableId]) {
        dataSourceWithAction[tableId] = actions;
      } else {
        dataSourceWithAction[tableId].push(...actions);
      }
    });
  });

  return dataSourceWithAction;
}

const databaseManager = new DatabaseManager({
  databaseType: 'MySQL',
  getTable: async (context) => {
    if (!context.user.roles?.length) return [];

    const dataSourceWithAction = await getDataSourceWithActionWithRole(
      context.user.roles
    );

    const dataSourceIds = Object.keys(dataSourceWithAction);
    const tableDataSource = await db<DatabaseSource>(DATABASE_SOURCE_TABLE_NAME)
      .whereIn('id', dataSourceIds)
      .andWhere((builder) => builder.whereNull('columnName'))
      .select('id', 'tableName', 'description');

    return tableDataSource.map((record) => ({
      name: record.tableName,
      description: record.description,
      supportedActions: [...new Set(dataSourceWithAction[record.id])] as any,
    }));
  },

  getTableColumns: async (tableName, context) => {
    if (!context.user.roles?.length) return [];

    const dataSourceWithAction = await getDataSourceWithActionWithRole(
      context.user.roles
    );

    const dataSourceIds = Object.keys(dataSourceWithAction);
    const tableDataSource = await db<DatabaseSource>(DATABASE_SOURCE_TABLE_NAME)
      .whereIn('id', dataSourceIds)
      .andWhere('tableName', '=', tableName)
      .andWhere((builder) => builder.whereNotNull('columnName'))
      .select(
        'id',
        'columnName',
        'description',
        'key',
        'nullable',
        'type',
        'extra'
      );

    return tableDataSource.map((record) => ({
      name: record.columnName || '',
      description: record.description,
      type: record.type || '',
      key: record.key,
      nullable: record.nullable,
      extra: record.extra,
      supportedActions: [...new Set(dataSourceWithAction[record.id])] as any,
    }));
  },

  executeSql: async (sql: string) => {
    return db.raw(sql);
  },
});

export default databaseManager;
