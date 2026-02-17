// apps/auth/src/config/validation.schema.ts
import * as Joi from 'joi';
import { knexDatabaseValidationSchema } from '@gomin/database';

export const validationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Redis
  REDIS_HOST: Joi.string()
    .hostname()
    .default('localhost'),
  REDIS_PORT: Joi.number()
    .port()
    .default(6379),
  REDIS_PASSWORD: Joi.string()
    .optional()
    .allow(''),

  // gRPC
  GRPC_PORT: Joi.number()
    .port()
    .default(5000),
  HOST: Joi.string()
    .hostname()
    .default('localhost'),
}).concat(knexDatabaseValidationSchema);
