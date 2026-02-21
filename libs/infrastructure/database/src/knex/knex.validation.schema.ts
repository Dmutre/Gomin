import * as Joi from 'joi';

/**
 * Shared validation schema for database/Knex configuration.
 * Use with Joi.object().concat() to merge into your app's validation schema.
 *
 * @example
 * ```ts
 * const validationSchema = Joi.object({
 *   NODE_ENV: Joi.string().valid('development', 'production').default('development'),
 * }).concat(knexDatabaseValidationSchema);
 * ```
 */
export const knexDatabaseValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().uri().required().messages({
    'string.uri': 'DATABASE_URL must be a valid PostgreSQL connection string',
    'any.required': 'DATABASE_URL is required',
  }),
  DB_POOL_MIN: Joi.number().integer().min(1).default(2),
  DB_POOL_MAX: Joi.number().integer().min(1).default(10),
}).required();
