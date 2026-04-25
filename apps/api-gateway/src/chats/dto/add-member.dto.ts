import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsUUID } from 'class-validator';

export enum MemberRoleDto {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export class AddMemberDto {
  @ApiProperty({ description: 'User ID of the member to add' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ enum: MemberRoleDto, example: MemberRoleDto.MEMBER })
  @IsEnum(MemberRoleDto)
  role!: MemberRoleDto;

  @ApiPropertyOptional({
    description:
      'ISO 8601 date — restrict history access to messages after this date',
  })
  @IsOptional()
  @IsISO8601()
  canReadFrom?: string;
}
