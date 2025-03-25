import { TokenModule } from "../../tokens/token.module";
import { DatabaseModule } from "../../database/database.module";
import { SessionService } from "./session.service";
import { Module } from "@nestjs/common";

@Module({
  imports: [DatabaseModule, TokenModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
