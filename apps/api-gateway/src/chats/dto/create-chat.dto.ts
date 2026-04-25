import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum ChatTypeDto {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
  CHANNEL = 'CHANNEL',
}

export class CreateChatDto {
  @ApiProperty({ enum: ChatTypeDto, example: ChatTypeDto.DIRECT })
  @IsEnum(ChatTypeDto)
  type!: ChatTypeDto;

  @ApiPropertyOptional({ description: 'Required for GROUP and CHANNEL types' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({
    type: [String],
    description: 'Usernames of members to include (besides yourself)',
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  memberUsernames!: string[];
}
