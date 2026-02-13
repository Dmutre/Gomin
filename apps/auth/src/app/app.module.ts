import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validationSchema } from "../config/schemas";
import configs from '../config/config';
import { CustomLoggerModule } from "./logger.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      load: configs,
    }),
    CustomLoggerModule,
  ],
})
export class AppModule {}
