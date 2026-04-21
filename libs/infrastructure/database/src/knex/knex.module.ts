import { Logger, Module } from '@nestjs/common';
import { KnexModule } from 'nest-knexjs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DATABASE_CONFIG_NAMESPACE } from './knex.config';

/**
 * General purpose knex module for fast use in new projects.
 * For opportunities like multiple connections we should write some more general module.
 * This is for fast plug in use.
 */
@Module({
  imports: [
    KnexModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const db = configService.get<{
          url: string;
          poolMin: number;
          poolMax: number;
          logQueries: boolean;
        }>(DATABASE_CONFIG_NAMESPACE);

        const knexLogger = new Logger('Knex');

        return {
          config: {
            client: 'pg',
            connection: db?.url,
            pool: {
              min: db?.poolMin ?? 2,
              max: db?.poolMax ?? 10,
            },
            debug: db?.logQueries ?? false,
            log: {
              warn: (msg: string) => knexLogger.warn(msg),
              error: (msg: string) => knexLogger.error(msg),
              deprecate: (msg: string) =>
                knexLogger.warn(`[deprecated] ${msg}`),
              debug: (msg: string) => knexLogger.debug(msg),
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class KnexDatabaseModule {}
