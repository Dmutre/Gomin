import { Type } from "class-transformer";
import { SessionDTO } from "../../sessions";
import { LoginDTO } from "./login.dto"
import { IsNotEmpty, ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UserLoginDTO extends LoginDTO {
  @ApiProperty({ description: 'The session to login', type: SessionDTO })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SessionDTO)
  session: SessionDTO;
}
