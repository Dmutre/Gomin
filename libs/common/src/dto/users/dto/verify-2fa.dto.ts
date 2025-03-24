import { IsNotEmpty, IsString } from "class-validator";
import { UserIdDTO } from "./user-id.dto";

export class Verify2FADTO extends UserIdDTO {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  sessionId: string;
}