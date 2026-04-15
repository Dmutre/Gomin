import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { MessageType } from '@gomin/grpc';

export class EncryptedPayloadDto {
  @ApiProperty({ description: 'AES-256-GCM ciphertext (base64)' })
  @IsString()
  @IsNotEmpty()
  encryptedContent!: string;

  @ApiProperty({ description: 'AES-GCM IV (base64)' })
  @IsString()
  @IsNotEmpty()
  iv!: string;

  @ApiProperty({ description: 'AES-GCM auth tag (base64)' })
  @IsString()
  @IsNotEmpty()
  authTag!: string;

  @ApiProperty({ description: 'Key epoch — matches chat keyVersion' })
  @IsInt()
  @Min(0)
  keyVersion!: number;

  @ApiProperty({
    description: 'Chain ratchet step (for out-of-order delivery)',
  })
  @IsInt()
  @Min(0)
  iteration!: number;
}

export class SendMessageDto {
  @ApiProperty({ type: EncryptedPayloadDto })
  @ValidateNested()
  @Type(() => EncryptedPayloadDto)
  payload!: EncryptedPayloadDto;

  @ApiProperty({ enum: MessageType, example: MessageType.MESSAGE_TYPE_TEXT })
  @IsEnum(MessageType)
  type!: MessageType;

  @ApiPropertyOptional({ description: 'ID of the message being replied to' })
  @IsOptional()
  @IsUUID()
  replyToId?: string;
}
