import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DeviceType } from '@gomin/grpc';

export class E2EEKeysDto {
  @IsString()
  @IsNotEmpty()
  publicKey: string;

  @IsString()
  @IsNotEmpty()
  encryptedPrivateKey: string;

  @IsString()
  @IsNotEmpty()
  encryptionSalt: string;

  @IsString()
  @IsNotEmpty()
  encryptionIv: string;

  @IsString()
  @IsNotEmpty()
  encryptionAuthTag: string;
}

export class DeviceInfoDto {
  @IsString()
  deviceId: string;

  @IsString()
  deviceName: string;

  @IsEnum(DeviceType)
  deviceType: DeviceType;

  @IsString()
  os: string;

  @IsString()
  browser: string;

  @IsString()
  appVersion: string;

  @IsString()
  ipAddress: string;

  @IsString()
  userAgent: string;
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/)
  password: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ValidateNested()
  @Type(() => E2EEKeysDto)
  e2eeKeys: E2EEKeysDto;

  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo: DeviceInfoDto;
}
