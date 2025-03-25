import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class SessionIdDTO {
  @ApiProperty({ description: 'The ID of the session to terminate' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}
