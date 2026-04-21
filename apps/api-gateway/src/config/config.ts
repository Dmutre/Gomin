import { registerAs } from '@nestjs/config';
import { telemetryConfig } from '@gomin/telemetry';
import { redisConfig } from '@gomin/redis';
import { CONFIG_NAMESPACES } from './consts';

export { redisConfig };

export const appConfig = registerAs(CONFIG_NAMESPACES.APP, () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || 'localhost',
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
    serviceSecret: (process.env.SERVICE_SECRET || '').trim(),
  }),
);

const configs = [
  appConfig,
  redisConfig,
  authServiceConfig,
  communicationServiceConfig,
  serviceIdentityConfig,
  telemetryConfig,
];

export default configs;
