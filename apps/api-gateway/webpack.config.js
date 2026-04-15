const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/api-gateway'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: [
        './src/assets',
        {
          input: 'libs/contracts/grpc/src/protos',
          glob: 'user-auth.proto',
          output: './protos',
        },
        {
          input: 'libs/contracts/grpc/src/protos',
          glob: 'service-identity.proto',
          output: './protos',
        },
        {
          input: 'libs/contracts/grpc/src/protos',
          glob: 'communication.proto',
          output: './protos',
        },
      ],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMap: true,
    }),
  ],
};
