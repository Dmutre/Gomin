import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class TransferOwnershipDto {
  @ApiProperty({ description: 'User ID of the new owner' })
  @IsUUID()
  newOwnerId!: string;
}
