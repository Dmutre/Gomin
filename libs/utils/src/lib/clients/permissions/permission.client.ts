import { PermissionDTO, PermissionMessagePatterns, PERMISSIONS_SERVICE } from "@gomin/common";
import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Observable } from "rxjs";

@Injectable()
export class PermissionClient {

  constructor(@Inject(PERMISSIONS_SERVICE) private readonly client: ClientProxy) {}

  async createPermission(payload: PermissionDTO) {
    return this.client.emit(PermissionMessagePatterns.CREATE_PERMISSION, payload);
  }

  async createManyPermissions(payload: PermissionDTO[]) {
    return this.client.emit(PermissionMessagePatterns.CREATE_MANY_PERMISSIONS, payload);
  }

  async getUserPermissions(userId: string): Promise<Observable<PermissionDTO[]>> {
    return this.client.emit(PermissionMessagePatterns.GET_USER_PERMISSIONS, userId);
  }

  async checkUserPermissions(userId: string, permissionCodes: string[]): Promise<Observable<boolean>> {
    return this.client.emit(PermissionMessagePatterns.CHECK_USER_PERMISSIONS, { userId, permissionCodes });
  }
  
  async deletePermission(userId: string, permissionCode: string) {
    return this.client.emit(PermissionMessagePatterns.DELETE_PERMISSION, { userId, permissionCode });
  }

  async deleteManyPermissions(userId: string, permissionCodes: string[]) {
    return this.client.emit(PermissionMessagePatterns.DELETE_MANY_PERMISSIONS, { userId, permissionCodes });
  }

  async updateManyPermissions(payload: PermissionDTO[]) {
    return this.client.emit(PermissionMessagePatterns.UPDATE_MANY_PERMISSIONS, payload);
  }
}

