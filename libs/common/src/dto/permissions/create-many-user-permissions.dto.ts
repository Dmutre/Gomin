import { Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";
import { CreateUserPermissionDTO } from "./create-user-permission.dto";

export class CreateManyUserPermissions {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUserPermissionDTO)
  userPermissions: CreateUserPermissionDTO[]
}