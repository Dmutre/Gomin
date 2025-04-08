import { Module } from "@nestjs/common";
import { CommunicationDatabaseService } from "./communication-database.service";

@Module({
  providers: [CommunicationDatabaseService],
  exports: [CommunicationDatabaseService],
})
export class CommunicationDatabaseModule {}


