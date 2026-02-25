import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class TerminateSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionToken: string;

  @IsString()
  @IsNotEmpty()
  targetSessionToken: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  password: string;
}
