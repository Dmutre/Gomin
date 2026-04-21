import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import {
  STRONG_PASSWORD_MESSAGE,
  STRONG_PASSWORD_REGEX,
} from '../validation/strong-password.const';

export enum DeviceTypeDto {
  MOBILE = 'MOBILE',
  DESKTOP = 'DESKTOP',
  TABLET = 'TABLET',
  WEB = 'WEB',
}

export class E2eeKeysDto {
  @ApiProperty({ description: 'RSA public key (PEM or base64)' })
  @IsString()
  @IsNotEmpty()
  publicKey!: string;

  @ApiProperty({ description: 'AES-encrypted private key (base64)' })
  @IsString()
  @IsNotEmpty()
  encryptedPrivateKey!: string;

  @ApiProperty({ description: 'PBKDF2 salt (base64)' })
  @IsString()
  @IsNotEmpty()
  encryptionSalt!: string;

  @ApiProperty({ description: 'AES-GCM IV (base64)' })
  @IsString()
  @IsNotEmpty()
  encryptionIv!: string;

  @ApiProperty({ description: 'AES-GCM auth tag (base64)' })
  @IsString()
  @IsNotEmpty()
  encryptionAuthTag!: string;
}

export class DeviceInfoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  deviceName!: string;

  @ApiProperty({ enum: DeviceTypeDto, enumName: 'DeviceType' })
  @IsEnum(DeviceTypeDto)
  deviceType!: DeviceTypeDto;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  os!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  browser!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  appVersion!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userAgent!: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'alice' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    minLength: 12,
    maxLength: 128,
    description:
      'Uppercase, lowercase, digit, and special character; 12–128 characters.',
    example: 'Str0ng!Passw0rd',
  })
  @IsString()
  @Matches(STRONG_PASSWORD_REGEX, { message: STRONG_PASSWORD_MESSAGE })
  password: string;

  @ApiPropertyOptional({ example: '+380501234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ type: E2eeKeysDto })
  @ValidateNested()
  @Type(() => E2eeKeysDto)
  e2eeKeys!: E2eeKeysDto;

  @ApiProperty({ type: DeviceInfoDto })
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo!: DeviceInfoDto;
}
