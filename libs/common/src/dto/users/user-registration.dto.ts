import { Type } from "class-transformer";
import { SessionDTO } from "../sessions/session.dto";
import { RegistrationDTO } from "./registration.dto";
import { IsObject, ValidateNested } from "class-validator";


export class UserRegistrationDTO extends RegistrationDTO {
  @IsObject()
  @ValidateNested()
  @Type(() => SessionDTO)
  session: SessionDTO;
}