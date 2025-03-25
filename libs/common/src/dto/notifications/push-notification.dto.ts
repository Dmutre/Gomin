import { IsNotEmpty, IsObject, IsString } from "class-validator";

export class PushNotificationDTO {
  @IsString()
  @IsNotEmpty()
  token: string;
  
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;
}
