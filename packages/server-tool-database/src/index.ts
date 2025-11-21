import { AIService, ButlerAi } from '@butler/server-ai';
import { default as DatabaseManager } from './databaseManager';

export { DatabaseManager };

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
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The SQL query to execute',
            },
          },
          required: ['query'],
        },
      },
      async (args: { query: string }, context: ButlerAi.AiService.Context) => {
        const { query } = args;

        if (!query) {
          return 'Query is required';
        }

        return await databaseManager.executeSql(query, context);
      }
    )
    .addFunctionTool(
      {
        name: 'get_db_table_names',
        description: 'Get the database tables description.',
      },
      async (_: any, context: ButlerAi.AiService.Context) => {
        return await databaseManager.getTables(context);
      }
    )
    .addFunctionTool(
      {
        name: 'get_db_table_columns',
        description: 'Get the database table columns',
        parameters: {
          type: 'object',
          properties: {
            table_name: {
              type: 'string',
              description: 'The table name',
            },
          },
          required: ['table_name'],
        },
      },
      async (
        args: { table_name: string },
        context: ButlerAi.AiService.Context
      ) => {
        const { table_name } = args;

        if (!table_name) {
          return 'Table name is required';
        }

        return databaseManager.getTableColumns(table_name, context);
      }
    );
}
