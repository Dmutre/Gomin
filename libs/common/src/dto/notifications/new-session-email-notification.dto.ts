import { Type } from "class-transformer";
import { NewSessionNotificationDTO } from "../sessions/dto/new-session-notification.dto";
import { IsEmail, ValidateNested } from "class-validator";

export class NewSessionEmailNotificationDTO {
  @IsEmail()
  email: string;

  @Type(() => NewSessionNotificationDTO)
  @ValidateNested()
  data: NewSessionNotificationDTO;
}
