import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { ExecutorDTO } from "../../common";

export class SendMessageDTO extends ExecutorDTO {
  @IsUUID()
  chatId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsUUID()
  @IsOptional()
  replyToId?: string;
}