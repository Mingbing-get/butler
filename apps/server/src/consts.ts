import dotenv from 'dotenv';

dotenv.config();

export const DB_TABLE_PREFIX = process.env.DB_TABLE_PREFIX || '';
export const USER_TABLE_NAME = `${DB_TABLE_PREFIX}user`;
export const ROLE_TABLE_NAME = `${DB_TABLE_PREFIX}role`;
export const DATABASE_SOURCE_TABLE_NAME = `${DB_TABLE_PREFIX}database_source`;
export const API_SOURCE_TABLE_NAME = `${DB_TABLE_PREFIX}api_source`;
