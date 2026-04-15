import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddReactionDto {
  @ApiProperty({ example: '👍', description: 'Emoji character' })
  @IsString()
  @IsNotEmpty()
  emoji!: string;
}
