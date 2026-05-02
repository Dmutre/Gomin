import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
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
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    type: [String],
    description: 'Usernames of members to include (besides yourself)',
  })
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(50, { each: true })
  memberUsernames!: string[];
}
