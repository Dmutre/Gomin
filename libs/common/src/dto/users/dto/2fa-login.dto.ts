import { IsNotEmpty, IsString } from "class-validator";
import { UserLoginDTO } from "./user-login.dto";

export class TwoFaLoginDTO extends UserLoginDTO {
  @IsNotEmpty()
  @IsString()
  code: string;
}
