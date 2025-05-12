import { ApiProperty } from '@nestjs/swagger'
import { MessageStatus } from '@my-prisma/client/communication'

export class ReplyMessageResponse {
  @ApiProperty()
  id: string

  @ApiProperty()
  content: string
}

export class MessageResponse {
  @ApiProperty()
  id: string

  @ApiProperty()
  chatId: string

  @ApiProperty({ nullable: true })
  senderId: string | null

  @ApiProperty()
  content: string

  @ApiProperty({ enum: MessageStatus })
  status: MessageStatus

  @ApiProperty()
  isEdited: boolean

  @ApiProperty()
  isPinned: boolean

  @ApiProperty({ type: () => ReplyMessageResponse, nullable: true })
  replyTo: ReplyMessageResponse | null

  @ApiProperty()
  createdAt: string

  @ApiProperty()
  updatedAt: string
}