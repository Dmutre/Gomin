import { IsUUID } from "class-validator";
import { ExecutorDTO } from "../common";

export class PassChatOwnershipDTO extends ExecutorDTO {
  @IsUUID()
  chatId: string;

  @IsUUID()
  newOwnerId: string;
}