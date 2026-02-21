import { Module } from '@nestjs/common';
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
        }>(DATABASE_CONFIG_NAMESPACE);
        return {
          config: {
            client: 'pg',
            connection: db?.url,
            pool: {
              min: db?.poolMin ?? 2,
              max: db?.poolMax ?? 10,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class KnexDatabaseModule {}
