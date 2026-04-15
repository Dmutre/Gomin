import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsUUID } from 'class-validator';
import { ChatMemberRole } from '@gomin/grpc';

export class AddMemberDto {
  @ApiProperty({ description: 'User ID of the member to add' })
  @IsUUID()
  targetUserId!: string;

  @ApiProperty({
    enum: ChatMemberRole,
    example: ChatMemberRole.CHAT_MEMBER_ROLE_MEMBER,
  })
  @IsEnum(ChatMemberRole)
  role!: ChatMemberRole;

  @ApiPropertyOptional({
    description:
      'ISO 8601 date — restrict history access to messages after this date',
  })
  @IsOptional()
  @IsISO8601()
  canReadFrom?: string;
}
