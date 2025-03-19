import { Module } from "@nestjs/common";
import { UserRepository } from "./repositories/user.repository";
import { UserDatabaseModule } from "@gomin/users-db";
import { SessionRepository } from "./repositories/session.repository";
import { TokenRepository } from "./repositories/token.repository";
import { UserSettingsRepository } from "./repositories/user-setting.repository";
import { FileRepository } from "./repositories/file.repository";

@Module({
  imports: [UserDatabaseModule],
  providers: [UserRepository, SessionRepository, TokenRepository, UserSettingsRepository, FileRepository],
  exports: [UserRepository, SessionRepository, TokenRepository, UserSettingsRepository, FileRepository],
})
export class DatabaseModule {}
