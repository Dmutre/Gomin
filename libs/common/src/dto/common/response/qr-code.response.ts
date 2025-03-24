import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class QRCodeResponse {
  @ApiProperty({ description: 'The QR code to scan', example: 'base64 encoded image' })
  @IsString()
  @IsNotEmpty()
  qrcode: string;
}