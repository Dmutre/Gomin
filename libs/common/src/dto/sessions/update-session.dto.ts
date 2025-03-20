import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateSessionDTO {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  location?: string;
}

