import { Injectable } from "@nestjs/common";
import { PermissionRepository } from "../lib/database/repositories/permission.repository";
import { UserPermissionRepository } from "../lib/database/repositories/user-permission.repository";
import { CreateUserPermissionDTO, UserPermissionCodesDTO, MessageDTO, DeleteUserPermissionDTO, DeleteManyUserPermissionsDTO, UpdateUserPermissionsAllowanceDTO } from "@gomin/common";
import { UserPermissionFull } from "@gomin/permission-db";

@Injectable()
export class PermissionService {
  constructor(
    private readonly permissionRepository: PermissionRepository,
    private readonly userPermissionRepository: UserPermissionRepository
  ) {}

  async createUserPermission(permission: CreateUserPermissionDTO): Promise<UserPermissionFull> {
    return this.userPermissionRepository.createUserPermission(permission);
  }

  async createManyUserPermissions(permissions: CreateUserPermissionDTO[]): Promise<MessageDTO> {
    await this.userPermissionRepository.createManyUserPermissions(permissions);
    return { message: 'User permissions created successfully' };
  }

  async checkUserPermissions(permission: UserPermissionCodesDTO): Promise<boolean> {
    const codeSet = new Set(permission.codes);
    const userPermissions = await this.userPermissionRepository.findUserPermissions({
      where: {
        userId: permission.userId,
        permission: {
          code: { in: Array.from(codeSet) }
        } 
      }
    });

    return userPermissions.length >= codeSet.size;
  }

  async getUserPermissions(userId: string): Promise<UserPermissionFull[]> {
    return this.userPermissionRepository.findUserPermissions({
      where: {
        userId
      }
    });
  }

  async updatePermissionsAllowance(data: UpdateUserPermissionsAllowanceDTO): Promise<MessageDTO> {
    await Promise.all(
      data.userPermissions.map((item) =>
        this.userPermissionRepository.updateUserPermission({
          where: { id: item.userPermissionIds },
          data: { allowed: item.allow },
        })
      )
    );
  
    return { message: 'User permissions updated successfully' };
  }
  

  async deleteUserPermission(data: DeleteUserPermissionDTO): Promise<MessageDTO> {
    const permission = await this.permissionRepository.findPermission({
      where: {
        code: data.permissionCode
      }
    });

    await this.userPermissionRepository.deleteUserPermission({
      where: {
        userId_permissionId_entityId_entityType: {
          userId: data.userId,
          permissionId: permission.id,
          entityId: data.entityId,
          entityType: data.entityType
        }
      }
    });
    return { message: 'User permission deleted successfully' };
  }

  async deleteManyUserPermissions(input: DeleteManyUserPermissionsDTO): Promise<MessageDTO> {
    await Promise.all(
      input.userPermissions.map(async (dto) => {
        try {
          const permission = await this.permissionRepository.findPermission({
            where: { code: dto.permissionCode }
          });
    
          if (!permission) return;
    
          await this.userPermissionRepository.deleteUserPermission({
            where: {
              userId_permissionId_entityId_entityType: {
                userId: dto.userId,
                permissionId: permission.id,
                entityId: dto.entityId,
                entityType: dto.entityType
              }
            }
          });
        } catch (err) {
          console.error(`Failed to delete permission ${dto.permissionCode}:`, err);
        }
      })
    );    
  
    return { message: 'User permissions deleted successfully' };
  }
  
}

