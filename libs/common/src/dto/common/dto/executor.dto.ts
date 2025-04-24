import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

export class ExecutorDTO {
  @ApiProperty({ description: 'Id of the user that perform the action' })
  @IsUUID()
  @IsNotEmpty()
  executorId: string;
}