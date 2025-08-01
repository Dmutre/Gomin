import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class IdDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;
}