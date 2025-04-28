import { IsUUID } from "class-validator";
import { ExecutorDTO } from "../../common";

export class MessageActionDTO extends ExecutorDTO {
  @IsUUID()
  chatId: string;

  @IsUUID()
  messageId: string;
}