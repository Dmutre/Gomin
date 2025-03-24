import { IsNotEmpty, IsString } from "class-validator";

export class TokenDTO {
  @IsString()
  @IsNotEmpty()
  token: string;
}


