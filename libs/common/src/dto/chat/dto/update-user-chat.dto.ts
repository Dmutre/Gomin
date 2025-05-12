import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsUUID, IsString, IsOptional } from "class-validator";

export class UpdateUserChatDTO {
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