import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().port().default(3000),
  HOST: Joi.string().default('0.0.0.0'),

  AUTH_SERVICE_URL: Joi.string().default('localhost:5000'),
  COMMUNICATION_SERVICE_URL: Joi.string().default('localhost:5001'),
});
