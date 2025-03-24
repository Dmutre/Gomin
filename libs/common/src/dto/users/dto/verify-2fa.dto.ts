import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { UserIdDTO } from "./user-id.dto";

export class Verify2FADTO extends UserIdDTO {
  @ApiProperty({ description: 'The code to verify', example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'The session id to verify' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}