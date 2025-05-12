import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsUUID } from "class-validator";
import { ExecutorDTO } from "../../common";

export class UpdateChatDTO extends ExecutorDTO {
  @ApiProperty()
  @IsUUID()
  chatId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}