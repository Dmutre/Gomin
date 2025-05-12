import { ApiProperty } from '@nestjs/swagger'
import { ChatType } from '@my-prisma/client/communication'
import { MessageResponse } from './message.response'
import { UserChatResponse } from './user-chat.response'

export class ChatResponse {
  @ApiProperty()
  id: string

  @ApiProperty({ enum: ChatType })
  type: ChatType

  @ApiProperty()
  name: string

  @ApiProperty()
  description: string

  @ApiProperty()
  ownerId: string

  @ApiProperty()
  createdAt: string

  @ApiProperty()
  updatedAt: string

  @ApiProperty({ type: () => [MessageResponse] })
  messages: MessageResponse[]

  @ApiProperty({ type: () => [UserChatResponse] })
  members: UserChatResponse[]
}
