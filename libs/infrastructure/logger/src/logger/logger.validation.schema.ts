import * as Joi from 'joi';

/**
 * Shared validation schema for logger configuration.
 * Use with Joi.object().concat() to merge into your app's validation schema.
 *
 * SERVICE_NAME is intentionally left to each service's own schema because
 * each service has a different meaningful default.
 *
 * @example
 * ```ts
 * const validationSchema = Joi.object({ ... }).concat(loggerValidationSchema);
 * ```
 */
export const loggerValidationSchema = Joi.object({
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
    .default('info'),
});
