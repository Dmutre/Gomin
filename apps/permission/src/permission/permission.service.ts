import { Injectable } from "@nestjs/common";
import { PermissionRepository } from "../lib/database/repositories/permission.repository";
import { UserPermissionRepository } from "../lib/database/repositories/user-permission.repository";

@Injectable()
export class PermissionService {
  constructor(
    private readonly permissionRepository: PermissionRepository,
    private readonly userPermissionRepository: UserPermissionRepository
  ) {}

  async createPermission(permission: PermissionDTO) {
    return this.permissionRepository.createPermission(permission);
  }
}

