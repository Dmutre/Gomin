import { Injectable, HttpStatus } from '@nestjs/common'
import { Prisma, Message } from '@my-prisma/client/communication'
import { CommunicationDatabaseService, MESSAGE_FULL_INCLUDE } from '@gomin/communication-db'
import { MicroserviceException } from '@gomin/common'

@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: CommunicationDatabaseService) {}

  async createMessage(data: Prisma.MessageCreateInput): Promise<Message> {
    return this.prisma.message.create({ data })
  }

  async findMessageById(id: string): Promise<Message | null> {
    return this.prisma.message.findUnique({ where: { id }, ...MESSAGE_FULL_INCLUDE })
  }

  async findOrThrow(id: string): Promise<Message> {
    const message = await this.findMessageById(id)
    if (!message) {
      throw new MicroserviceException('Message does not exist', HttpStatus.NOT_FOUND)
    }
    return message
  }

  async updateMessage(id: string, data: Prisma.MessageUpdateInput): Promise<Message> {
    return this.prisma.message.update({ where: { id }, data })
  }

  async deleteMessage(id: string): Promise<Message> {
    return this.prisma.message.delete({ where: { id } })
  }
}
