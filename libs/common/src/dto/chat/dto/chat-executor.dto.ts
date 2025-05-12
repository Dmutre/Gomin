import { IsUUID } from "class-validator";
import { ExecutorDTO } from "../../common";

export class ChatExecutorDTO extends ExecutorDTO {
  @IsUUID()
  chatId: string;
}