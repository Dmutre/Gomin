import { IsNotEmpty, IsString } from "class-validator";
import { UserLoginDTO } from "./user-login.dto";
import { ApiProperty } from "@nestjs/swagger";

export class TwoFaLoginDTO extends UserLoginDTO {
  @ApiProperty({ description: 'The code to verify', example: '123456' })
  @IsNotEmpty()
  @IsString()
  code: string;
}
