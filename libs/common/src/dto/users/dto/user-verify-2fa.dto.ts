import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UserVerify2FADTO {
  @ApiProperty({ description: 'The code to verify', example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'The session id to verify' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}