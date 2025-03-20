import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../lib/database/database.module";
import { TokenService } from "./token.service";

@Module({
  imports: [DatabaseModule],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
