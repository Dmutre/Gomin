import * as dotenv from 'dotenv';
import type { Knex } from 'knex';

dotenv.config();

const isTs = __filename.endsWith('.ts');

const config: Knex.Config = {
  client: 'pg',
  connection: process.env.DATABASE_URL,

  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  },

  migrations: {
    directory: './database/migrations',
    tableName: 'knex_migrations',
    extension: isTs ? 'ts' : 'js',
    loadExtensions: isTs ? ['.ts'] : ['.js'],
  },

  seeds: {
    directory: './database/seeds',
    extension: isTs ? 'ts' : 'js',
  },
};

export default config;
