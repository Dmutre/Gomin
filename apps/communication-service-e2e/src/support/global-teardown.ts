import { killPort } from '@nx/node/utils';
/* eslint-disable */

module.exports = async function () {
  const port = process.env.GRPC_PORT ? Number(process.env.GRPC_PORT) : 5001;
  await killPort(port);
  console.log(globalThis.__TEARDOWN_MESSAGE__);
};
