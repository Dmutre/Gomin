// apps/auth/src/config/validation.schema.ts
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Database
  DATABASE_URL: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'DATABASE_URL must be a valid PostgreSQL connection string',
      'any.required': 'DATABASE_URL is required',
    }),
  DB_POOL_MIN: Joi.number()
    .integer()
    .min(1)
    .default(2),
  DB_POOL_MAX: Joi.number()
    .integer()
    .min(1)
    .default(10),

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

  // RabbitMQ
  RABBITMQ_URL: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'RABBITMQ_URL must be a valid AMQP connection string',
      'any.required': 'RABBITMQ_URL is required',
    }),

  // gRPC
  GRPC_PORT: Joi.number()
    .port()
    .default(5000),
});