import { DynamicModule, ForwardReference, Module, Type } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ServiceIdentityGrpcClient } from './service-identity.client';

export const SERVICE_IDENTITY_CLIENT = 'SERVICE_IDENTITY_CLIENT';

const PROTO_PATH = join(__dirname, '../../protos', 'service-identity.proto');

export interface ServiceIdentityClientModuleOptions {
  url?: string;
}

@Module({})
export class ServiceIdentityClientModule {
  static register(
    options: ServiceIdentityClientModuleOptions = {},
  ): DynamicModule {
    return this.build(
      ClientsModule.register([
        {
          name: SERVICE_IDENTITY_CLIENT,
          transport: Transport.GRPC,
          options: {
            package: 'service_identity.v1',
            protoPath: PROTO_PATH,
            url: options.url ?? 'localhost:5000',
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
          name: SERVICE_IDENTITY_CLIENT,
          imports: options.imports ?? [],
          inject: options.inject ?? [],
          useFactory: async (...args) => {
            const { url } = await options.useFactory(...args);
            return {
              transport: Transport.GRPC,
              options: {
                package: 'service_identity.v1',
                protoPath: PROTO_PATH,
                url,
              },
            };
          },
        },
      ]),
    );
  }

  private static build(clientsModule: DynamicModule): DynamicModule {
    return {
      module: ServiceIdentityClientModule,
      imports: [clientsModule],
      providers: [ServiceIdentityGrpcClient],
      exports: [ServiceIdentityGrpcClient],
    };
  }
}
