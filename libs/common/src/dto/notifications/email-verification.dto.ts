import { IsString, IsNotEmpty, IsEmail } from "class-validator";

export class EmailVerificationDTO {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}
