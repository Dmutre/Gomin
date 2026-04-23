import { DynamicModule, ForwardReference, Module, Type } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { UserAuthGrpcClient } from './user-auth.grpc.client';
import { USER_AUTH_CLIENT } from './user-auth.tokens';
import { ROUND_ROBIN_SERVICE_CONFIG, toDnsUrl } from '../grpc-client.utils';

const PROTO_PATH = join(__dirname, 'protos', 'user-auth.proto');

export interface UserAuthClientModuleOptions {
  url?: string;
}

@Module({})
export class AuthClientModule {
  static register(options: UserAuthClientModuleOptions = {}): DynamicModule {
    return this.build(
      ClientsModule.register([
        {
          name: USER_AUTH_CLIENT,
          transport: Transport.GRPC,
          options: {
            package: 'user_auth.v1',
            protoPath: PROTO_PATH,
            url: toDnsUrl(options.url ?? 'localhost:5000'),
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
          name: USER_AUTH_CLIENT,
          imports: options.imports ?? [],
          inject: options.inject ?? [],
          useFactory: async (...args) => {
            const { url } = await options.useFactory(...args);
            return {
              transport: Transport.GRPC,
              options: {
                package: 'user_auth.v1',
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
      module: AuthClientModule,
      imports: [clientsModule],
      providers: [UserAuthGrpcClient],
      exports: [UserAuthGrpcClient],
    };
  }
}
