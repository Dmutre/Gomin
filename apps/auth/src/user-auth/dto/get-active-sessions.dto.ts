import { IsNotEmpty, IsString } from 'class-validator';

export class GetActiveSessionsDto {
  @IsString()
  @IsNotEmpty()
  sessionToken: string;
}
