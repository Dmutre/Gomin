import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class EmailDTO {
  @ApiProperty({ description: 'The email address of the user', example: 'test@example.com' })
  @IsEmail()
  email: string;
}