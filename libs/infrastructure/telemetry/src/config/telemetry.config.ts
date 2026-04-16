import { registerAs } from '@nestjs/config';

export const TELEMETRY_CONFIG_NAMESPACE = 'telemetry';

export const telemetryConfig = registerAs(TELEMETRY_CONFIG_NAMESPACE, () => ({
  otlpEndpoint: process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] ?? 'http://localhost:4317',
}));
