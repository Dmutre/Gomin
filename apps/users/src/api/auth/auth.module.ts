import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { DatabaseModule } from "../../lib/database/database.module";
import { JwtTokenModule } from "../../lib/security/jwt/jwt-token.module";
import { TokenModule } from "../../lib/tokens/token.module";
import { SessionModule } from "../../lib/security/sessions/session.module";
import { NotificationClientModule } from "@gomin/utils";

@Module({
  imports: [
    DatabaseModule,
    JwtTokenModule,
    TokenModule,
    SessionModule,
    NotificationClientModule,
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
