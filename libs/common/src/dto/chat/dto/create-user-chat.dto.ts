import { ChatType } from "@my-prisma/client/communication";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsString, IsNotEmpty, IsOptional, IsArray, Length } from "class-validator";

export class CreateUserChatDTO {
  @ApiProperty({ enum: ChatType })
  @IsEnum(ChatType)
  type: ChatType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Length(1) // At least one member: the owner
  members: string[];
}