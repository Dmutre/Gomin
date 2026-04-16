import { createOtelSdk } from '@gomin/telemetry';

const sdk = createOtelSdk({ serviceName: 'api-gateway' });

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown().catch(console.error);
});
