import { Injectable } from "@nestjs/common";
import { PermissionDatabaseService } from "@gomin/permission-db";
import { PermissionDTO } from "@gomin/common";
import { Prisma } from "@my-prisma/client/permissions";

@Injectable()
export class PermissionRepository {
  constructor(private readonly prisma: PermissionDatabaseService) {}

  async createPermission(permission: PermissionDTO) {
    return this.prisma.permission.create({
      data: permission,
    });
  }

  async createManyPermissions(permissions: PermissionDTO[]) {
    return this.prisma.permission.createMany({
      data: permissions,
    });
  }
  
  async findPermissions(args: Prisma.PermissionFindManyArgs) {
    return this.prisma.permission.findMany(args);
  }

  async findPermission(args: Prisma.PermissionFindUniqueArgs) {
    return this.prisma.permission.findUnique(args);
  }

  async deletePermission(args: Prisma.PermissionDeleteArgs) {
    return this.prisma.permission.delete(args);
  }

  async deleteManyPermissions(args: Prisma.PermissionDeleteManyArgs) {
    return this.prisma.permission.deleteMany(args);
  }
}

