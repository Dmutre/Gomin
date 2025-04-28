import { Injectable, HttpStatus } from '@nestjs/common'
import { Prisma, Message } from '@my-prisma/client/communication'
import { CommunicationDatabaseService, MESSAGE_FULL_INCLUDE, MessageFull } from '@gomin/communication-db'
import { MicroserviceException } from '@gomin/common'

@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: CommunicationDatabaseService) {}

  async createMessage(data: Prisma.MessageUncheckedCreateInput): Promise<MessageFull> {
    return await this.prisma.message.create({ data, ...MESSAGE_FULL_INCLUDE });
  }

  async findMessageById(id: string): Promise<MessageFull | null> {
    return await this.prisma.message.findUnique({ where: { id }, ...MESSAGE_FULL_INCLUDE });
  }

  async findOrThrow(id: string): Promise<MessageFull> {
    const message = await this.findMessageById(id);
    if (!message) {
      throw new MicroserviceException('Message does not exist', HttpStatus.NOT_FOUND);
    }
    return message;
  }

  async updateMessage(id: string, data: Prisma.MessageUpdateInput): Promise<Message> {
    return await this.prisma.message.update({ where: { id }, data });
  }

  async updateManyMessages(args: Prisma.MessageUpdateManyArgs) {
    return await this.prisma.message.updateMany(args);
  }

  async deleteMessage(id: string): Promise<Message> {
    return await this.prisma.message.delete({ where: { id } });
  }

  async findMessages(args: Prisma.MessageFindManyArgs) {
    return await this.prisma.message.findMany(args);
  }
}
