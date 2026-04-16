export interface OtelSdkOptions {
  /**
   * Logical service name — shows up as `service.name` in all signals.
   * E.g. 'api-gateway', 'auth', 'communication-service'
   */
  serviceName: string;

  /**
   * Optional semver version emitted as `service.version`.
   * Defaults to '1.0.0'.
   */
  serviceVersion?: string;

  /**
   * OTLP gRPC collector endpoint.
   * Falls back to OTEL_EXPORTER_OTLP_ENDPOINT env var, then 'http://localhost:4317'.
   */
  otlpEndpoint?: string;

  /**
   * How often (ms) to push metrics to the collector.
   * Defaults to 30 000 ms.
   */
  metricExportIntervalMs?: number;
}
