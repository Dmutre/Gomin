import EventEmitter from 'events';
import { createOtelSdk } from '@gomin/telemetry';

// OTel HTTP instrumentation + pino-http + NestJS middleware each attach
// finish/close listeners to ServerResponse. Raise the threshold to prevent
// false-positive MaxListenersExceeded warnings under concurrent load.
EventEmitter.defaultMaxListeners = 30;

const sdk = createOtelSdk({ serviceName: 'api-gateway' });

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown().catch(console.error);
});
