import { IsUUID } from "class-validator";
import { ExecutorDTO } from "../common";

export class RemoveUserFromChatDTO extends ExecutorDTO {
  @IsUUID()
  chatId: string;

  @IsUUID()
  userId: string;
}