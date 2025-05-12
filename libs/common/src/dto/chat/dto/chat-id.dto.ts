import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class ChatIdDTO {
  @ApiProperty()
  @IsUUID()
  chatId: string;
}