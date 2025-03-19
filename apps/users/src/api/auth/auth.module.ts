import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { DatabaseModule } from "../../lib/database/database.module";
import { JwtTokenModule } from "../../lib/security/jwt-token.module";

@Module({
  imports: [
    DatabaseModule,
    JwtTokenModule,
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
