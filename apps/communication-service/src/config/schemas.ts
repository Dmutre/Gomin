import * as Joi from 'joi';
import { knexDatabaseValidationSchema } from '@gomin/database';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  REDIS_HOST: Joi.string().hostname().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().optional().allow(''),

  GRPC_PORT: Joi.number().port().default(5001),
  HOST: Joi.string().hostname().default('localhost'),
}).concat(knexDatabaseValidationSchema);
