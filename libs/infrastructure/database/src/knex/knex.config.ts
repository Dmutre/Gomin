import { registerAs } from '@nestjs/config';

export const DATABASE_CONFIG_NAMESPACE = 'database';

/**
 * Shared database configuration for NestJS ConfigModule.
 * Load this in your app's ConfigModule.forRoot({ load: [databaseConfig] }).
 */
export const knexDatabaseConfig = registerAs(DATABASE_CONFIG_NAMESPACE, () => ({
  url: process.env['DATABASE_URL'],
  poolMin: parseInt(process.env['DB_POOL_MIN'] || '2', 10),
  poolMax: parseInt(process.env['DB_POOL_MAX'] || '10', 10),
}));
