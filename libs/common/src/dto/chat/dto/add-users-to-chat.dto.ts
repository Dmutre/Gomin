import { IsArray, IsNotEmpty, IsString, IsUUID, MinLength } from "class-validator";
import { ExecutorDTO } from "../../common";

export class AddUsersToChatDTO extends ExecutorDTO {
  @IsUUID()
  chatId: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MinLength(1)
  users: string[];
}