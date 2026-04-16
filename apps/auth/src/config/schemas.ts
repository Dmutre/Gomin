import * as Joi from 'joi';
import { knexDatabaseValidationSchema } from '@gomin/database';
import { loggerValidationSchema } from '@gomin/logger';
import { telemetryValidationSchema } from '@gomin/telemetry';

const baseEnvSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Redis
  REDIS_HOST: Joi.string().hostname().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().optional().allow(''),

  // gRPC
  GRPC_PORT: Joi.number().port().default(5000),
  HOST: Joi.string().hostname().default('localhost'),

  // JWT signing keys — JSON array of { keyId, privateKey, publicKey }
  JWT_SIGNING_KEYS: Joi.string().default('[]'),

  SERVICE_NAME: Joi.string().default('auth'),
});

const additionalValidationSchemas = [
  knexDatabaseValidationSchema,
  loggerValidationSchema,
  telemetryValidationSchema,
];

export const validationSchema = additionalValidationSchemas.reduce(
  (schema, next) => schema.concat(next),
  baseEnvSchema,
);
