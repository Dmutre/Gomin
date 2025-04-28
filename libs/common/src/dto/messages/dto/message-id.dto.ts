import { IsUUID } from "class-validator";

export class MessageIdDTO {
  @IsUUID()
  messageId: string;
}