import { AuthConfig } from "@gomin/common";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { JwtTokenService } from "./jwt-token.service";

@Module({
  imports: [
  JwtModule.registerAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const authConfig = configService.get<AuthConfig>('auth');
        return {
          secret: authConfig.secret,
          signOptions: { expiresIn: authConfig.accessTtl }
        }
      }
    })
  ],
  providers: [JwtTokenService],
  exports: [JwtTokenService],
})
export class JwtTokenModule {}
