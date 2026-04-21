import * as Joi from 'joi';

export const telemetryValidationSchema = Joi.object({
  OTEL_EXPORTER_OTLP_ENDPOINT: Joi.string()
    .uri()
    .default('http://localhost:4317'),
});
