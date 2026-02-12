import * as dotenv from 'dotenv';
import * as path from 'path';
import type { Knex } from 'knex';

dotenv.config();

const config: Knex.Config = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  },
  
  migrations: {
    directory: path.join(__dirname, 'src/database/migrations'),
    tableName: 'knex_migrations',
    extension: 'ts',
  },
  
  seeds: {
    directory: path.join(__dirname, 'src/database/seeds'),
    extension: 'ts',
  },
};

export default config;
