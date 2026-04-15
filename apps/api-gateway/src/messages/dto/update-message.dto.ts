import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { EncryptedPayloadDto } from './send-message.dto';

export class UpdateMessageDto {
  @ApiProperty({
    type: EncryptedPayloadDto,
    description: 'Re-encrypted message payload',
  })
  @ValidateNested()
  @Type(() => EncryptedPayloadDto)
  payload!: EncryptedPayloadDto;
}
