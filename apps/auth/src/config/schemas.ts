import * as Joi from 'joi';
import { knexDatabaseValidationSchema } from '@gomin/database';
import { loggerValidationSchema } from '@gomin/logger';
import { telemetryValidationSchema } from '@gomin/telemetry';
import { redisValidationSchema } from '@gomin/redis';

const baseEnvSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  GRPC_PORT: Joi.number().port().default(5000),
  HOST: Joi.string().hostname().default('localhost'),

  JWT_SIGNING_KEYS: Joi.string().default('[]'),

  SERVICE_NAME: Joi.string().default('auth'),
});

const additionalValidationSchemas = [
  redisValidationSchema,
  knexDatabaseValidationSchema,
  loggerValidationSchema,
  telemetryValidationSchema,
];

export const validationSchema = additionalValidationSchemas.reduce(
  (schema, next) => schema.concat(next),
  baseEnvSchema,
);
