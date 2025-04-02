import { EntityType } from "@my-prisma/client/permissions";
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateUserPermissionDTO {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  entityId?: string;

  @IsEnum(EntityType)
  @IsNotEmpty()
  entityType: EntityType;

  @IsBoolean()
  @IsOptional()
  allowed?: boolean = true;
}
