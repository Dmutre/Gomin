import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class MarkAsReadDto {
  @ApiProperty({
    description:
      'Mark all messages up to and including this message ID as read',
  })
  @IsUUID()
  upToMessageId!: string;
}
