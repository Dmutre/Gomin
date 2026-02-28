import * as Joi from 'joi';

export const microserviceIdentityValidationSchema = Joi.object({
  AUTH_SERVICE_URL: Joi.string().uri().required(),
  SERVICE_NAME: Joi.string().required(),
  SERVICE_SECRET: Joi.string().required(),
});
