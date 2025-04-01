import { UserPermissionDTO } from "./user-permission.dto";

export class UpdateUserPermissionsDTO {
  add: UserPermissionDTO[];
  remove: UserPermissionDTO[];
}

