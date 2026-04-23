import { DynamicModule, ForwardReference, Module, Type } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { CommunicationGrpcClient } from './communication.client';
import { COMMUNICATION_CLIENT } from './communication.tokens';
import { ROUND_ROBIN_SERVICE_CONFIG, toDnsUrl } from '../grpc-client.utils';

const PROTO_PATH = join(__dirname, 'protos', 'communication.proto');

export interface CommunicationClientModuleOptions {
  url?: string;
}

@Module({})
export class CommunicationClientModule {
  static register(
    options: CommunicationClientModuleOptions = {},
  ): DynamicModule {
    return this.build(
      ClientsModule.register([
        {
          name: COMMUNICATION_CLIENT,
          transport: Transport.GRPC,
          options: {
            package: 'communication.v1',
            protoPath: PROTO_PATH,
            url: toDnsUrl(options.url ?? 'localhost:5001'),
            channelOptions: {
              'grpc.service_config': ROUND_ROBIN_SERVICE_CONFIG,
            },
          },
        },
      ]),
    );
  }

  static registerAsync(options: {
    imports?: (
      | DynamicModule
      | Type<any>
      | Promise<DynamicModule>
      | ForwardReference<any>
    )[];
    inject?: unknown[];
    useFactory: (
      ...args: unknown[]
    ) => { url: string } | Promise<{ url: string }>;
  }): DynamicModule {
    return this.build(
      ClientsModule.registerAsync([
        {
          name: COMMUNICATION_CLIENT,
          imports: options.imports ?? [],
          inject: options.inject ?? [],
          useFactory: async (...args) => {
            const { url } = await options.useFactory(...args);
            return {
              transport: Transport.GRPC,
              options: {
                package: 'communication.v1',
                protoPath: PROTO_PATH,
                url: toDnsUrl(url),
                channelOptions: {
                  'grpc.service_config': ROUND_ROBIN_SERVICE_CONFIG,
                },
              },
            };
          },
        },
      ]),
    );
  }

  private static build(clientsModule: DynamicModule): DynamicModule {
    return {
      module: CommunicationClientModule,
      imports: [clientsModule],
      providers: [CommunicationGrpcClient],
      exports: [CommunicationGrpcClient],
    };
  }
}
