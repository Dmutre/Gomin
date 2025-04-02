import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { UserIdDTO } from "../users";
import { EntityType } from "@my-prisma/client/permissions";

export class DeleteUserPermissionDTO extends UserIdDTO {
  @IsString()
  @IsNotEmpty()
  permissionCode: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  entityId?: string;

  @IsEnum(EntityType)
  @IsNotEmpty()
  entityType: EntityType;
}