import dotenv from 'dotenv';
import knex from 'knex';

dotenv.config();

const db = knex({
  client: process.env.DB_CLIENT,
  connection: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  pool: {
    min: Number(process.env.DB_POOL_MIN),
    max: Number(process.env.DB_POOL_MAX),
    acquireTimeoutMillis: Number(process.env.DB_POOL_ACQUIRE_TIMEOUT),
    idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT),
  },
});

export default db;
