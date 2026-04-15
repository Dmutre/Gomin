import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TerminateSessionDto {
  @ApiProperty({ description: 'The session token to terminate' })
  @IsString()
  @IsNotEmpty()
  targetSessionToken!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class TerminateAllOtherSessionsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password!: string;
}
