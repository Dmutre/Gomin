import { IsIP, IsNotEmpty, IsOptional, IsString } from "class-validator"
import { ApiProperty } from "@nestjs/swagger";

export class SessionDTO {
  @ApiProperty({ description: 'The device name', example: 'My Device' })
  @IsString()
  @IsNotEmpty()
  deviceName: string;

  @ApiProperty({ description: 'The IP address of the device', example: '192.168.1.1' })
  @IsString()
  @IsIP()
  ipAddress: string;

  @ApiProperty({ description: 'The user agent of the device', example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' })
  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @ApiProperty({ description: 'The location of the device', example: 'New York, NY' })
  @IsString()
  @IsOptional()
  location?: string;
}
