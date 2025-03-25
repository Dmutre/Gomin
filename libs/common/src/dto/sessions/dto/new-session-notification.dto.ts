import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class NewSessionNotificationDTO {
  @IsString()
  @IsOptional()
  deviceName: string;

  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @IsString()
  @IsNotEmpty()
  timestamp: string;
}
