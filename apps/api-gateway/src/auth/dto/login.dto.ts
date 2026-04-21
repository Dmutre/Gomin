import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { DeviceInfoDto } from './register.dto';

export class LoginDto {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Str0ng!Passw0rd'})
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ type: DeviceInfoDto })
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo!: DeviceInfoDto;
}
