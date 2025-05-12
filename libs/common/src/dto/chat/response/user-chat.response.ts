import { ApiProperty } from '@nestjs/swagger'
import { UserChatRole } from '@my-prisma/client/communication'

export class UserChatResponse {
  @ApiProperty()
  id: string

  @ApiProperty()
  userId: string

  @ApiProperty()
  chatId: string

  @ApiProperty({ enum: UserChatRole })
  role: UserChatRole

  @ApiProperty()
  createdAt: string
}
