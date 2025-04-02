import { IsArray, ValidateNested } from "class-validator";
import { UserIdDTO } from "../users";
import { DeleteUserPermissionDTO } from "./delete-user-permission.dto";
import { Type } from "class-transformer";

export class DeleteManyUserPermissionsDTO extends UserIdDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeleteUserPermissionDTO)
  userPermissions: DeleteUserPermissionDTO[];
}
