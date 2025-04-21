import { Injectable, HttpStatus } from '@nestjs/common'
import { Prisma, Chat } from '@my-prisma/client/communication'
import { CommunicationDatabaseService, CHAT_FULL_INCLUDE, ChatFull } from '@gomin/communication-db'
import { MicroserviceException } from '@gomin/common'

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: CommunicationDatabaseService) {}

  async createChat(data: Prisma.ChatCreateInput): Promise<ChatFull> {
    return await this.prisma.chat.create({ data, ...CHAT_FULL_INCLUDE })
  }

  async findChatById(id: string): Promise<ChatFull | null> {
    return await this.prisma.chat.findUnique({ where: { id }, ...CHAT_FULL_INCLUDE })
  }

  async findOrThrow(id: string): Promise<ChatFull> {
    const chat = await this.findChatById(id)
    if (!chat) {
      throw new MicroserviceException('Chat does not exist', HttpStatus.NOT_FOUND)
    }
    return chat
  }

  async updateChat(id: string, data: Prisma.ChatUpdateInput): Promise<ChatFull> {
    return await this.prisma.chat.update({ where: { id }, data, ...CHAT_FULL_INCLUDE })
  }

  async deleteChat(id: string): Promise<Chat> {
    return await this.prisma.chat.delete({ where: { id } })
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    return await this.prisma.chat.findMany({
      where: { members: { some: { userId }}},
    })
  }
}
