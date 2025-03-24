import { ApiProperty } from '@nestjs/swagger';

export class MessageDTO {
  @ApiProperty()
  message: string;
}