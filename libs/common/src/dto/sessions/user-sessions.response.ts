import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class UserSessionsResponse {
  @ApiProperty({ description: 'Session ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Device name' })
  @Expose()
  deviceName: string;

  @ApiProperty({ description: 'User agent' })
  @Expose()
  userAgent: string;

  @ApiProperty({ description: 'IP address' })
  @Expose()
  ipAddress: string;

  @ApiProperty({ description: 'Location' })
  @Expose()
  location: string;

  @ApiProperty({ description: 'Created at' })
  @Expose()
  createdAt: Date;
}

