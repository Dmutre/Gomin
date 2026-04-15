import { registerAs } from '@nestjs/config';
import { CONFIG_NAMESPACES } from './consts';

export const appConfig = registerAs(CONFIG_NAMESPACES.APP, () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || 'localhost',
}));

export const redisConfig = registerAs(CONFIG_NAMESPACES.REDIS, () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
}));

export const authServiceConfig = registerAs(
  CONFIG_NAMESPACES.AUTH_SERVICE,
  () => ({
    url: process.env.AUTH_SERVICE_URL || 'localhost:5000',
  }),
);

export const communicationServiceConfig = registerAs(
  CONFIG_NAMESPACES.COMMUNICATION_SERVICE,
  () => ({
    url: process.env.COMMUNICATION_SERVICE_URL || 'localhost:5001',
  }),
);

export const serviceIdentityConfig = registerAs(
  CONFIG_NAMESPACES.SERVICE_IDENTITY,
  () => ({
    authServiceUrl: process.env.AUTH_SERVICE_URL || 'localhost:5000',
    serviceName: process.env.SERVICE_NAME || 'gateway-service',
    serviceSecret: process.env.SERVICE_SECRET || '',
  }),
);

const configs = [
  appConfig,
  redisConfig,
  authServiceConfig,
  communicationServiceConfig,
  serviceIdentityConfig,
];

export default configs;
