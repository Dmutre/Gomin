import { IsArray, IsString, IsUUID, MinLength } from "class-validator";
import { ExecutorDTO } from "../../common";

export class ReadMessagesDTO extends ExecutorDTO {
  @IsUUID()
  chatId: string;

  @IsArray()
  @IsString({ each: true })
  @MinLength(1)
  messageIds: string[];
}