import { PermissionDatabaseService } from "@gomin/permission-db";
import { Injectable } from "@nestjs/common";
import { UserPermissionDTO } from "@gomin/common";
import { Prisma } from "@my-prisma/client/permissions";

@Injectable()
export class UserPermissionRepository {
  constructor(private readonly prisma: PermissionDatabaseService) {}

  async createUserPermission(userPermission: UserPermissionDTO) {
    return this.prisma.userPermission.create({
      data: userPermission,
    });
  }

  async createManyUserPermissions(userPermissions: UserPermissionDTO[]) {
    return this.prisma.userPermission.createMany({
      data: userPermissions,
    });
  }

  async findUserPermissions(args: Prisma.UserPermissionFindManyArgs) {
    return this.prisma.userPermission.findMany(args);
  }

  async findUserPermission(args: Prisma.UserPermissionFindUniqueArgs) {
    return this.prisma.userPermission.findUnique(args);
  }
  
  async updateUserPermission(args: Prisma.UserPermissionUpdateArgs) {
    return this.prisma.userPermission.update(args);
  }

  async updateManyUserPermissions(args: Prisma.UserPermissionUpdateManyArgs) {
    return this.prisma.userPermission.updateMany(args);
  }

  async deleteUserPermission(args: Prisma.UserPermissionDeleteArgs) {
    return this.prisma.userPermission.delete(args);
  }

  async deleteManyUserPermissions(args: Prisma.UserPermissionDeleteManyArgs) {
    return this.prisma.userPermission.deleteMany(args);
  }
}



