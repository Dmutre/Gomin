import { Module } from "@nestjs/common";
import { PermissionService } from "./permission.service";
import { DatabaseModule } from "../lib/database/database.module";

@Module({
  imports: [
    DatabaseModule,
  ],
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
