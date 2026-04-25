import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { MemberRoleDto } from './add-member.dto';

export class UpdateMemberRoleDto {
  @ApiProperty({
    enum: [MemberRoleDto.ADMIN, MemberRoleDto.MEMBER],
    description: 'New role. Use transfer-ownership endpoint to assign OWNER.',
  })
  @IsEnum(MemberRoleDto)
  newRole!: MemberRoleDto;
}
