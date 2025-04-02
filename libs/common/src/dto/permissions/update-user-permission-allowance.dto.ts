import { IsString, IsNotEmpty, IsBoolean, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class UpdateUserPermissionAllowanceDTO {
  @IsNotEmpty()
  @IsString()
  userPermissionIds: string;

  @IsBoolean()
  allow: boolean;
}

export class UpdateUserPermissionsAllowanceDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateUserPermissionAllowanceDTO)
  userPermissions: UpdateUserPermissionAllowanceDTO[];
}