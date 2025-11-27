import { z } from 'zod';
import { AIService, AiNucl } from '@ai-nucl/server-ai';
import { default as DatabaseManager } from './databaseManager';

export { DatabaseManager };
export * from './type';

declare module '@ai-nucl/server-ai' {
  export namespace AiNucl {
    export namespace AiService {
      export interface FunctionToolMap {
        query_db: {};
        get_db_tables: {};
        get_db_table_columns: {};
      }
    }
  }
}

export function addDatabaseTool(
  aiService: AIService,
  databaseManager: DatabaseManager
) {
  aiService
    .addFunctionTool(
      {
        name: 'query_db',
        description:
          'Query the database, only actions supported by the table can be performed, when deleting and inserting, there is no need to check the actions supported by the table columns. When querying and modifying, only the columns corresponding to supported actions can be operated.',
        parameters: z.object({
          query: z.string().describe('The SQL query to execute'),
        }),
      },
      async (args: { query: string }, context: AiNucl.AiService.Context) => {
        return await databaseManager.executeSql(args.query, context);
      }
    )
    .addFunctionTool(
      {
        name: 'get_db_tables',
        description: 'Get the database tables description.',
      },
      async (_: any, context: AiNucl.AiService.Context) => {
        return await databaseManager.getTables(context);
      }
    )
    .addFunctionTool(
      {
        name: 'get_db_table_columns',
        description: 'Get the database table columns',
        parameters: z.object({
          table_name: z.string().describe('The table name'),
        }),
      },
      async (
        args: { table_name: string },
        context: AiNucl.AiService.Context
      ) => {
        return databaseManager.getTableColumns(args.table_name, context);
      }
    );
}
