import dotenv from 'dotenv';
import { AIService } from '@ai-nucl/server-ai';
import { addDatabaseTool } from '@ai-nucl/server-tool-database';

import databaseManager from './databaseManager';

dotenv.config();

// 创建 AI 服务
const aiService = new AIService({
  apiKey: process.env.OPENAI_API_KEY || '',
  apiUrl: process.env.OPENAI_API_URL || '',
  defaultModel: process.env.OPENAI_DEFAULT_MODEL || '',
  supportFunctionCall: process.env.OPENAI_SUPPORT_FUNCTION_CALL === 'true',
});

// 添加数据库工具
addDatabaseTool(aiService, databaseManager);

// 导出 AI 服务
export default aiService;
