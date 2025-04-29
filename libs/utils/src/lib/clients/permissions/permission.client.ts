import { CreateManyUserPermissions, CreateUserPermissionDTO, DeleteUserPermissionDTO, MessageDTO, PermissionMessagePatterns, PERMISSIONS_SERVICE, UpdateUserPermissionsAllowanceDTO, UserIdDTO, UserPermissionCodesDTO } from "@gomin/common";
import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Observable } from "rxjs";
import { UserPermissionFull } from "@gomin/permission-db";

@Injectable()
export class PermissionClient {

  constructor(@Inject(PERMISSIONS_SERVICE) private readonly client: ClientProxy) {}

  async createUserPermission(payload: CreateUserPermissionDTO): Promise<Observable<UserPermissionFull>> {
    return this.client.send(PermissionMessagePatterns.CREATE_USER_PERMISSION, payload);
  }

  async createManyUserPermissions(payload: CreateUserPermissionDTO[]): Promise<Observable<MessageDTO>> {
    return this.client.send(PermissionMessagePatterns.CREATE_MANY_USER_PERMISSIONS, payload);
  }

  async getUserPermissions(payload: UserIdDTO): Promise<Observable<UserPermissionFull[]>> {
    return this.client.send(PermissionMessagePatterns.GET_USER_PERMISSIONS, payload);
  }

  async checkUserPermissions(payload: UserPermissionCodesDTO): Promise<Observable<boolean>> {
    return this.client.send(PermissionMessagePatterns.CHECK_USER_PERMISSIONS, payload);
  }

  async updateUserPermissionsAllowance(payload: UpdateUserPermissionsAllowanceDTO): Promise<Observable<MessageDTO>> {
    return this.client.send(PermissionMessagePatterns.UPDATE_USER_PERMISSIONS_ALLOWANCE, payload);
  }
  
  async deleteUserPermission(payload: DeleteUserPermissionDTO): Promise<Observable<MessageDTO>> {
    return this.client.send(PermissionMessagePatterns.DELETE_USER_PERMISSION, payload);
  }

  async deleteManyUserPermissions(payload: UserPermissionCodesDTO): Promise<Observable<MessageDTO>> {
    return this.client.send(PermissionMessagePatterns.DELETE_MANY_USER_PERMISSIONS, payload);
  }

  async createOrUpdateUserPermissions(userPermissions: CreateManyUserPermissions): Promise<Observable<MessageDTO>> {
    return this.client.send(PermissionMessagePatterns.UPDATE_OR_CREATE_USER_PERMISSIONS, userPermissions);
  }
}

