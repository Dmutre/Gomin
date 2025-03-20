import { Type } from "class-transformer";
import { SessionDTO } from "../sessions";
import { LoginDTO } from "./login.dto"
import { IsNotEmpty, ValidateNested } from "class-validator";

export class UserLoginDTO extends LoginDTO {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SessionDTO)
  session: SessionDTO;
}
