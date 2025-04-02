import { IsArray, IsString } from "class-validator";
import { UserIdDTO } from "../users";

export class UserPermissionCodesDTO extends UserIdDTO {
  @IsArray()
  @IsString({ each: true })
  codes: string[];
}