import * as Joi from 'joi';

export const validationSchema = Joi.object({
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
