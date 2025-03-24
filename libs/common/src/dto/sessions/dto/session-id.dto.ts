import { IsNotEmpty, IsString } from "class-validator";

export class SessionIdDTO {
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}
