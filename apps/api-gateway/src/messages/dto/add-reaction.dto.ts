import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddReactionDto {
  @ApiProperty({ example: '👍', description: 'Emoji character' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  emoji!: string;
}
