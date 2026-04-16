import { registerAs } from '@nestjs/config';
import { telemetryConfig } from '@gomin/telemetry';
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

export interface JwtSigningKeyConfig {
  keyId: string;
  privateKey: string;
  publicKey: string;
}

export const jwtConfig = registerAs(CONFIG_NAMESPACES.JWT, () => {
  const raw = process.env.JWT_SIGNING_KEYS || '[]';
  const keys = JSON.parse(raw) as JwtSigningKeyConfig[];
  return {
    signingKeys: keys,
    activeKey: keys.length > 0 ? keys[keys.length - 1] : null,
  };
});

const configs = [
  appConfig,
  knexDatabaseConfig,
  redisConfig,
  rabbitmqConfig,
  jwtConfig,
  telemetryConfig,
];

export default configs;
