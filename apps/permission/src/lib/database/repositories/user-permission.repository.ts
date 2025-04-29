import { PermissionDatabaseService, USER_PERMISSION_FULL_INCLUDE, UserPermissionFull } from "@gomin/permission-db";
import { HttpStatus, Injectable } from "@nestjs/common";
import { CreateUserPermissionDTO, MicroserviceException } from "@gomin/common";
import { Prisma } from "@my-prisma/client/permissions";

@Injectable()
export class UserPermissionRepository {
  constructor(private readonly prisma: PermissionDatabaseService) {}

  async createUserPermission(userPermission: CreateUserPermissionDTO): Promise<UserPermissionFull> {
    return this.prisma.userPermission.create({
      data: {
        permission: {
          connect: {
            code: userPermission.code,
          },
        },
        entityId: userPermission.entityId,
        entityType: userPermission.entityType,
        allowed: userPermission.allowed,
        userId: userPermission.userId,
      },
      include: USER_PERMISSION_FULL_INCLUDE.include
    });
  }

  async createManyUserPermissions(userPermissions: CreateUserPermissionDTO[]) {
    const permissionCodes = [...new Set(userPermissions.map((p) => p.code))];
  
    const permissions = await this.prisma.permission.findMany({
      where: { code: { in: permissionCodes } },
      select: { code: true, id: true },
    });
  
    const codeToIdMap = Object.fromEntries(permissions.map((p) => [p.code, p.id]));
  
    return this.prisma.userPermission.createMany({
      data: userPermissions.map((p) => ({
        permissionId: codeToIdMap[p.code],
        entityId: p.entityId,
        entityType: p.entityType,
        userId: p.userId,
        allowed: p.allowed,
      })),
      skipDuplicates: true,
    });
  }

  async upsertUserPermissions(userPermissions: CreateUserPermissionDTO[]) {
    return await Promise.all(
      userPermissions.map(async (permissionDto) => {
        const permission = await this.prisma.permission.findUnique({
          where: { code: permissionDto.code },
          select: { id: true },
        });
  
        if (!permission) {
          throw new MicroserviceException(`Permission with code '${permissionDto.code}' not found`, HttpStatus.NOT_FOUND);
        }
  
        return this.prisma.userPermission.upsert({
          where: {
            userId_permissionId_entityId_entityType: {
              userId: permissionDto.userId,
              permissionId: permission.id,
              entityId: permissionDto.entityId ?? null,
              entityType: permissionDto.entityType,
            },
          },
          create: {
            userId: permissionDto.userId,
            permissionId: permission.id,
            entityId: permissionDto.entityId,
            entityType: permissionDto.entityType,
            allowed: permissionDto.allowed,
          },
          update: {
            allowed: permissionDto.allowed,
          },
        });
      })
    )
  }

  async findUserPermissions(args: Prisma.UserPermissionFindManyArgs): Promise<UserPermissionFull[]> {
    return this.prisma.userPermission.findMany({ ...args, include: USER_PERMISSION_FULL_INCLUDE.include });
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



