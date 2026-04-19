import { ServiceIdentityClientModule } from '@gomin/grpc';
import { DynamicModule, InjectionToken, Module } from '@nestjs/common';
import type { ModuleMetadata, Provider } from '@nestjs/common';
import { MicroserviceIdentityAuthService } from './microservice-identity.auth.service';
import { MicroserviceIdentityGuard } from './microservice-identity.guard';
import { MicroserviceIdentityStore } from './microservice-identity.store';
import { MICROSERVICE_IDENTITY_OPTIONS } from './microservice-identity.tokens';

export interface MicroserviceIdentityOptions {
  authServiceUrl: string;
  serviceName: string;
  serviceSecret: string;
}

@Module({})
export class MicroserviceIdentityModule {
  static forRoot(options: MicroserviceIdentityOptions): DynamicModule {
    return this.build({
      optionsProvider: {
        provide: MICROSERVICE_IDENTITY_OPTIONS,
        useValue: options,
      },
      clientModule: ServiceIdentityClientModule.register({
        url: options.authServiceUrl,
      }),
    });
  }

  static forRootAsync(options: {
    useFactory: (
      ...args: unknown[]
    ) => Promise<MicroserviceIdentityOptions> | MicroserviceIdentityOptions;
    inject?: InjectionToken[];
    imports?: ModuleMetadata['imports'];
  }): DynamicModule {
    const optionsProvider: Provider = {
      provide: MICROSERVICE_IDENTITY_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };

    return this.build({
      optionsProvider,
      imports: options.imports,
      clientModule: ServiceIdentityClientModule.registerAsync({
        imports: options.imports,
        inject: options.inject ?? [],
        useFactory: async (...args: unknown[]) => {
          const opts = await options.useFactory(...args);
          return { url: opts.authServiceUrl };
        },
      }),
    });
  }

  private static build(params: {
    optionsProvider: Provider;
    clientModule: DynamicModule;
    imports?: ModuleMetadata['imports'];
  }): DynamicModule {
    return {
      module: MicroserviceIdentityModule,
      global: true,
      imports: [...(params.imports ?? []), params.clientModule],
      providers: [
        params.optionsProvider,
        MicroserviceIdentityStore,
        MicroserviceIdentityAuthService,
        MicroserviceIdentityGuard,
      ],
      exports: [
        MicroserviceIdentityStore,
        MicroserviceIdentityAuthService,
        MicroserviceIdentityGuard,
      ],
    };
  }
}
