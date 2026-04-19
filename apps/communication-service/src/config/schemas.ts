import * as Joi from 'joi';
import { knexDatabaseValidationSchema } from '@gomin/database';
import { loggerValidationSchema } from '@gomin/logger';
import { telemetryValidationSchema } from '@gomin/telemetry';
import { redisValidationSchema } from '@gomin/redis';

const baseEnvSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  GRPC_PORT: Joi.number().port().default(5001),
  HOST: Joi.string().hostname().default('localhost'),

  AUTH_SERVICE_URL: Joi.string().default('localhost:5000'),
  SERVICE_NAME: Joi.string().default('communication-service'),
  SERVICE_SECRET: Joi.string().required(),
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
