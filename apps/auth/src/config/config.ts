import { registerAs } from '@nestjs/config';
import { CONFIG_NAMESPACES } from './consts';

export const appConfig = registerAs(CONFIG_NAMESPACES.APP, () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  grpcPort: parseInt(process.env.GRPC_PORT || '3000', 10),
  host: process.env.HOST || 'localhost',
}));

export const databaseConfig = registerAs(CONFIG_NAMESPACES.DATABASE, () => ({
  url: process.env.DATABASE_URL,
  poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
  poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
}));

export const redisConfig = registerAs(CONFIG_NAMESPACES.REDIS, () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
}));

export const rabbitmqConfig = registerAs(CONFIG_NAMESPACES.RABBITMQ, () => ({
  url: process.env.RABBITMQ_URL,
}));

const configs = [
  appConfig,
  databaseConfig,
  redisConfig,
  rabbitmqConfig,
];

export default configs;
