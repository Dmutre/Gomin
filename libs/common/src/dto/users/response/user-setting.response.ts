import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class UserSettingResponse {
  @ApiProperty({ description: 'The duration of the session in days', example: '30' })
  @Expose()
  sessionDuration: number;
}

