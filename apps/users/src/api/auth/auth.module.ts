import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { DatabaseModule } from "../../lib/database/database.module";
import { JwtTokenModule } from "../../lib/security/jwt/jwt-token.module";
import { TokenModule } from "../tokens/token.module";
import { SessionModule } from "../../lib/security/sessions/session.module";
@Module({
  imports: [
    DatabaseModule,
    JwtTokenModule,
    TokenModule,
    SessionModule,
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
