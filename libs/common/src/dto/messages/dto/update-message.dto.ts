import { IsBoolean, IsNotEmpty, IsString, IsUUID } from "class-validator";
import { ExecutorDTO } from "../../common";

export class UpdateMessageDTO extends ExecutorDTO {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsBoolean()
  isPinned: boolean;

  @IsUUID()
  messageId: string;

  @IsUUID()
  chatId: string;
}