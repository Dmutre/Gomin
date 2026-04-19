import {
  DynamicModule,
  Global,
  InjectionToken,
  Module,
  ModuleMetadata,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { RedisPubSubService } from './redis-pubsub.service';

export const REDIS_CLIENT = 'REDIS_CLIENT';
export const REDIS_PREFIX = 'REDIS_PREFIX';

export interface RedisModuleOptions {
  prefix: string;
}

export interface RedisModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  inject?: InjectionToken[];
  useFactory: (
    ...args: unknown[]
  ) => Promise<RedisModuleOptions> | RedisModuleOptions;
}

const redisClientProvider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService) =>
    new Redis({
      host: config.get<string>('redis.host'),
      port: config.get<number>('redis.port'),
      password: config.get<string>('redis.password') || undefined,
      lazyConnect: true,
    }),
};

@Global()
@Module({})
export class RedisModule {
  static forRoot(options: RedisModuleOptions): DynamicModule {
    return {
      module: RedisModule,
      global: true,
      imports: [ConfigModule],
      providers: [
        { provide: REDIS_PREFIX, useValue: options.prefix },
        redisClientProvider,
        RedisService,
        RedisPubSubService,
      ],
      exports: [REDIS_CLIENT, REDIS_PREFIX, RedisService, RedisPubSubService],
    };
  }

  static forRootAsync(options: RedisModuleAsyncOptions): DynamicModule {
    return {
      module: RedisModule,
      global: true,
      imports: [ConfigModule, ...(options.imports ?? [])],
      providers: [
        {
          provide: REDIS_PREFIX,
          inject: options.inject ?? [],
          useFactory: async (...args: unknown[]) => {
            const opts = await options.useFactory(...args);
            return opts.prefix;
          },
        },
        redisClientProvider,
        RedisService,
        RedisPubSubService,
      ],
      exports: [REDIS_CLIENT, REDIS_PREFIX, RedisService, RedisPubSubService],
    };
  }
}
