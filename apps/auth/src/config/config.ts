import { registerAs } from '@nestjs/config';
import { CONFIG_NAMESPACES } from './consts';
import { knexDatabaseConfig } from '@gomin/database';

export const appConfig = registerAs(CONFIG_NAMESPACES.APP, () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  grpcPort: parseInt(process.env.GRPC_PORT || '3000', 10),
  host: process.env.HOST || 'localhost',
}));

export const redisConfig = registerAs(CONFIG_NAMESPACES.REDIS, () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
}));

export const rabbitmqConfig = registerAs(CONFIG_NAMESPACES.RABBITMQ, () => ({
  url: process.env.RABBITMQ_URL,
}));

const configs = [appConfig, knexDatabaseConfig, redisConfig, rabbitmqConfig];

export default configs;
