import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class TerminateAllOtherSessionsDto {
  @IsString()
  @IsNotEmpty()
  currentSessionId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  password: string;
}
