import { registerAs } from '@nestjs/config';

export const REDIS_CONFIG_NAMESPACE = 'redis';

export const redisConfig = registerAs(REDIS_CONFIG_NAMESPACE, () => ({
  host: process.env['REDIS_HOST'] || 'localhost',
  port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
  password: process.env['REDIS_PASSWORD'],
}));
