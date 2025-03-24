import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class TokenDTO {
  @ApiProperty({ description: 'The token to refresh' })
  @IsString()
  @IsNotEmpty()
  token: string;
}


