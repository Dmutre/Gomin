import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validationSchema } from "../config/schemas";
import configs from '../config/config';
import { CustomLoggerModule } from "@gomin/logger";
import { KnexDatabaseModule } from "@gomin/database";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      load: configs,
    }),
    CustomLoggerModule,
    KnexDatabaseModule,
  ],
})
export class AppModule {}
