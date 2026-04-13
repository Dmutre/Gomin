import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class GetUserPublicKeyDto {
  @IsString()
  @IsNotEmpty()
  sessionToken: string;

  @IsUUID()
  targetUserId: string;
}
