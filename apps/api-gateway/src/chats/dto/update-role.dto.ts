import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ChatMemberRole } from '@gomin/grpc';

export class UpdateMemberRoleDto {
  @ApiProperty({
    enum: [
      ChatMemberRole.CHAT_MEMBER_ROLE_ADMIN,
      ChatMemberRole.CHAT_MEMBER_ROLE_MEMBER,
    ],
    description: 'New role. Use transfer-ownership endpoint to assign OWNER.',
  })
  @IsEnum(ChatMemberRole)
  newRole!: ChatMemberRole;
}
