import { Controller } from "@nestjs/common";
import { PermissionService } from "./permission.service";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { CreateManyUserPermissions, CreateUserPermissionDTO, DeleteManyUserPermissionsDTO, DeleteUserPermissionDTO, MessageDTO, PermissionMessagePatterns, UpdateUserPermissionsAllowanceDTO, UserIdDTO, UserPermissionCodesDTO } from "@gomin/common";
import { UserPermissionFull } from "@gomin/permission-db";

@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @MessagePattern(PermissionMessagePatterns.CREATE_USER_PERMISSION)
  async createUserPermission(@Payload() payload: CreateUserPermissionDTO): Promise<UserPermissionFull> {
    return this.permissionService.createUserPermission(payload);
  }

  @MessagePattern(PermissionMessagePatterns.CREATE_MANY_USER_PERMISSIONS)
  async createManyUserPermissions(@Payload() { userPermissions }: CreateManyUserPermissions): Promise<MessageDTO> {
    return this.permissionService.createManyUserPermissions(userPermissions);
  }

  @MessagePattern(PermissionMessagePatterns.GET_USER_PERMISSIONS)
  async getUserPermissions(@Payload() payload: UserIdDTO): Promise<UserPermissionFull[]> {
    return this.permissionService.getUserPermissions(payload.userId);
  }

  @MessagePattern(PermissionMessagePatterns.CHECK_USER_PERMISSIONS)
  async checkUserPermissions(@Payload() payload: UserPermissionCodesDTO): Promise<boolean> {
    return this.permissionService.checkUserPermissions(payload);
  }

  @MessagePattern(PermissionMessagePatterns.UPDATE_USER_PERMISSIONS_ALLOWANCE)
  async updateUserPermissionsAllowance(@Payload() payload: UpdateUserPermissionsAllowanceDTO): Promise<MessageDTO> {
    return this.permissionService.updatePermissionsAllowance(payload);
  }

  @MessagePattern(PermissionMessagePatterns.DELETE_USER_PERMISSION)
  async deleteUserPermission(@Payload() payload: DeleteUserPermissionDTO): Promise<MessageDTO> {
    return this.permissionService.deleteUserPermission(payload);
  }

  @MessagePattern(PermissionMessagePatterns.DELETE_MANY_USER_PERMISSIONS)
  async deleteManyUserPermissions(@Payload() payload: DeleteManyUserPermissionsDTO): Promise<MessageDTO> {
    return this.permissionService.deleteManyUserPermissions(payload);
  }

  @MessagePattern(PermissionMessagePatterns.UPDATE_OR_CREATE_USER_PERMISSIONS)
  updateOrCreateUserPermissions(@Payload() { userPermissions }: CreateManyUserPermissions) {
    return this.permissionService.createOrUpdateUserPermissions(userPermissions);
  }
}
