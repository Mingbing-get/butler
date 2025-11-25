import { createDbMetaInstance } from '@ai-nucl/server-db-meta';

import db from './db';

main();

async function main() {
  const dbMeta = createDbMetaInstance(db);
  const tableNames = await dbMeta.getTableNames();

  for (const table of tableNames) {
    const columns = await dbMeta.getTableColumns(table.name);
    console.log(`表 ${table.name} 的列:`, columns);
  }
}
