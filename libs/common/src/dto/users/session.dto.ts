import { IsIP, IsNotEmpty, IsString } from "class-validator"

export class SessionDTO {
  @IsString()
  @IsNotEmpty()
  deviceName: string;

  @IsString()
  @IsIP()
  ipAddress: string;

  @IsString()
  @IsNotEmpty()
  userAgent: string;
}
