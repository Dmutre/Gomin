import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SenderKeyEntryDto {
  @ApiProperty({ description: 'User ID of the sender (chain key owner)' })
  @IsUUID()
  senderId!: string;

  @ApiProperty({
    description:
      'User ID of the recipient (who receives the wrapped chain key)',
  })
  @IsUUID()
  recipientId!: string;

  @ApiProperty({
    description:
      "Sender's chainKey encrypted with recipient's RSA-OAEP public key (base64). " +
      'Server stores this opaquely and never decrypts it.',
  })
  @IsString()
  @IsNotEmpty()
  encryptedSenderKey!: string;

  @ApiProperty({
    description: 'Key epoch — matches chat keyVersion at distribution time',
  })
  @IsInt()
  @Min(0)
  keyVersion!: number;
}

export class StoreSenderKeysDto {
  @ApiProperty({
    type: [SenderKeyEntryDto],
    description:
      'One entry per (sender, recipient) pair. On member removal rotate ' +
      'and re-send entries for all remaining members.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SenderKeyEntryDto)
  keys!: SenderKeyEntryDto[];
}
