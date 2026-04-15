import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ChatType } from '@gomin/grpc';

export class CreateChatDto {
  @ApiProperty({ enum: ChatType, example: ChatType.CHAT_TYPE_DIRECT })
  @IsEnum(ChatType)
  type!: ChatType;

  @ApiPropertyOptional({ description: 'Required for GROUP and CHANNEL types' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({
    type: [String],
    description: 'User IDs of members to include (besides yourself)',
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  memberUserIds!: string[];
}
