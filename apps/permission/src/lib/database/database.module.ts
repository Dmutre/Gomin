import { Module } from "@nestjs/common";
import { PermissionDatabaseModule } from "@gomin/permission-db";
import { PermissionRepository } from "./repositories/permission.repository";
import { UserPermissionRepository } from "./repositories/user-permission.repository";

@Module({
  imports: [PermissionDatabaseModule],
  providers: [PermissionRepository, UserPermissionRepository],
  exports: [PermissionRepository, UserPermissionRepository],
})
export class DatabaseModule {}
