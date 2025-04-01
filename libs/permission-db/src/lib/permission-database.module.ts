import { Module } from "@nestjs/common";
import { PermissionDatabaseService } from "./permission-database.service";

@Module({
  providers: [PermissionDatabaseService],
  exports: [PermissionDatabaseService],
})
export class PermissionDatabaseModule {}


