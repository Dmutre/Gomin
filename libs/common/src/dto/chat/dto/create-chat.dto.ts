import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ChatType } from "@my-prisma/client/communication";
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, Length } from "class-validator";

export class CreateChatDTO {
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
  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Length(1) // At least one member: the owner
  members: string[];
}