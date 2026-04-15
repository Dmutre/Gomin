import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, ValidateNested } from 'class-validator';
import { E2eeKeysDto } from './register.dto';
import {
  STRONG_PASSWORD_MESSAGE,
  STRONG_PASSWORD_REGEX,
} from '../validation/strong-password.const';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({
    minLength: 12,
    maxLength: 128,
    description:
      'Uppercase, lowercase, digit, and special character; 12–128 characters.',
    example: 'Str0ng!Passw0rd',
  })
  @IsString()
  @Matches(STRONG_PASSWORD_REGEX, { message: STRONG_PASSWORD_MESSAGE })
  newPassword!: string;

  @ApiProperty({
    type: E2eeKeysDto,
    description: 'Re-encrypted private key with new password',
  })
  @ValidateNested()
  @Type(() => E2eeKeysDto)
  e2eeKeys!: E2eeKeysDto;
}
