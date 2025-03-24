import { IsNotEmpty, IsString } from "class-validator";

export class QRCodeResponse {
  @IsString()
  @IsNotEmpty()
  qrcode: string;
}