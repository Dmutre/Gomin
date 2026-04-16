import { createOtelSdk } from '@gomin/telemetry';

const sdk = createOtelSdk({ serviceName: 'auth' });

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown().catch(console.error);
});
