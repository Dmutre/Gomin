import * as Joi from 'joi';
import { loggerValidationSchema } from '@gomin/logger';
import { telemetryValidationSchema } from '@gomin/telemetry';
import { redisValidationSchema } from '@gomin/redis';

const baseEnvSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().port().default(3000),
  HOST: Joi.string().hostname().default('localhost'),

  AUTH_SERVICE_URL: Joi.string().default('localhost:5000'),
  COMMUNICATION_SERVICE_URL: Joi.string().default('localhost:5001'),

  SERVICE_NAME: Joi.string().default('gateway-service'),
  SERVICE_SECRET: Joi.string().required(),
});

const additionalValidationSchemas = [
  redisValidationSchema,
  loggerValidationSchema,
  telemetryValidationSchema,
];

export const validationSchema = additionalValidationSchemas.reduce(
  (schema, next) => schema.concat(next),
  baseEnvSchema,
);
