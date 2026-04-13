import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { E2EEKeysDto } from './registration.dto';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  sessionToken: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/)
  newPassword: string;

  @ValidateNested()
  @Type(() => E2EEKeysDto)
  e2eeKeys: E2EEKeysDto;
}
