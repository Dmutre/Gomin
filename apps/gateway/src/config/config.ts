import { registerAs } from '@nestjs/config';
import { CONFIG_NAMESPACES } from './consts';

export const appConfig = registerAs(CONFIG_NAMESPACES.APP, () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
}));

export const grpcClientsConfig = registerAs(CONFIG_NAMESPACES.GRPC, () => ({
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'localhost:5000',
  communicationServiceUrl:
    process.env.COMMUNICATION_SERVICE_URL || 'localhost:5001',
}));

const configs = [appConfig, grpcClientsConfig];

export default configs;
