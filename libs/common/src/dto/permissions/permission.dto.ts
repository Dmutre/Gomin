import { IsNotEmpty, IsString } from "class-validator";


export class PermissionDTO {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
