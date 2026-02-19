import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class TerminateSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  targetSessionId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  password: string;
}
