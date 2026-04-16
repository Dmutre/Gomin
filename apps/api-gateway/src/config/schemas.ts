import * as Joi from 'joi';
import { loggerValidationSchema } from '@gomin/logger';
import { telemetryValidationSchema } from '@gomin/telemetry';

const baseEnvSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().port().default(3000),
  HOST: Joi.string().hostname().default('localhost'),

  REDIS_HOST: Joi.string().hostname().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().optional().allow(''),

  AUTH_SERVICE_URL: Joi.string().default('localhost:5000'),
  COMMUNICATION_SERVICE_URL: Joi.string().default('localhost:5001'),

  SERVICE_NAME: Joi.string().default('gateway-service'),
  SERVICE_SECRET: Joi.string().required(),
});

const additionalValidationSchemas = [loggerValidationSchema, telemetryValidationSchema];

export const validationSchema = additionalValidationSchemas.reduce(
  (schema, next) => schema.concat(next),
  baseEnvSchema,
);
