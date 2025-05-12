import { IsNotEmpty, IsOptional, IsUUID } from "class-validator";

export class ExecutorDTO {
  @IsUUID()
  @IsNotEmpty()
  @IsOptional()
  executorId?: string;
}