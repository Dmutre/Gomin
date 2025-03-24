import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { LoginDTO } from "./login.dto";

export class TwoFaUserLoginDTO extends LoginDTO {
  @ApiProperty({ description: 'The code to verify', example: '123456' })
  @IsNotEmpty()
  @IsString()
  code: string;
}

