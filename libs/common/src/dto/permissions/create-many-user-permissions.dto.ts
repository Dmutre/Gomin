import { Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";
import { CreateUserPermissionDTO } from "./create-user-permission.dto";
import { ExecutorDTO } from "../common";

export class CreateManyUserPermissions extends ExecutorDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUserPermissionDTO)
  userPermissions: CreateUserPermissionDTO[]
}