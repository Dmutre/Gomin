import { registerAs } from '@nestjs/config';

export const MICROSERVICE_IDENTITY_CONFIG_NAMESPACE = 'microservice-identity';

export const microserviceIdentityConfig = registerAs(
  MICROSERVICE_IDENTITY_CONFIG_NAMESPACE,
  () => ({
    authServiceUrl: process.env['AUTH_SERVICE_URL'],
    serviceName: process.env['SERVICE_NAME'],
    serviceSecret: process.env['SERVICE_SECRET'],
  }),
);
