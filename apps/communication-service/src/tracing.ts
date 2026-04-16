import { createOtelSdk } from '@gomin/telemetry';

const sdk = createOtelSdk({ serviceName: 'communication-service' });

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown().catch(console.error);
});
