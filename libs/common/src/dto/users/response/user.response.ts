import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { FileResponse } from "../../file/response/file.response";
import { UserSettingResponse } from "./user-setting.response";

export class UserResponse {
  @Expose()
  @ApiProperty({ type: String })
  id: string;

  @Expose()
  @ApiProperty({ type: String })
  email: string;

  @Expose()
  @ApiProperty({ type: String })
  username: string;

  @Expose()
  @ApiProperty({ type: String })
  firstName: string;

  @Expose()
  @ApiProperty({ type: String })
  lastName: string;

  @Expose()
  @ApiProperty({ type: String })
  bio: string;

  @Expose()
  @Type(() => FileResponse)
  @ApiProperty({ type: FileResponse })
  avatar: FileResponse;

  @Expose()
  @Type(() => UserSettingResponse)
  @ApiProperty({ type: UserSettingResponse })
  userSetting: UserSettingResponse;
}


