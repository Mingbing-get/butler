import dotenv from 'dotenv';
import { AIService } from '@butler/server-ai';
import { addDatabaseTool, DatabaseManager } from '@butler/server-tool-database';

import db from './db';

dotenv.config();

// 创建 AI 服务
const aiService = new AIService({
  apiKey: process.env.OPENAI_API_KEY || '',
  apiUrl: process.env.OPENAI_API_URL || '',
  defaultModel: process.env.OPENAI_DEFAULT_MODEL || '',
  supportFunctionCall: process.env.OPENAI_SUPPORT_FUNCTION_CALL === 'true',
});

// 添加数据库工具
const databaseManager = new DatabaseManager({
  databaseType: 'MySQL',
  getTable: async () => {
    return [
      {
        name: 'user',
        supportedActions: ['select', 'insert', 'update', 'delete'],
        columns: [
          {
            name: 'id',
            type: 'int',
            supportedActions: ['select'],
          },
          {
            name: 'name',
            type: 'varchar(255)',
            supportedActions: ['select', 'update'],
          },
          {
            name: 'age',
            type: 'int',
            supportedActions: ['select', 'update'],
          },
          {
            name: 'password',
            type: 'varchar(255)',
            supportedActions: ['select', 'update'],
          },
        ],
      },
    ];
  },
  getTableColumns: async () => [],
  executeSql: async (sql: string) => {
    return db.raw(sql);
  },
});
addDatabaseTool(aiService, databaseManager);

// 导出 AI 服务
export default aiService;
