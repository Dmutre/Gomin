import { HttpStatus, Injectable } from "@nestjs/common";
import { MessageRepository } from "../../lib/database/repositories/message.repository";
import { MicroserviceException, ReadMessagesDTO, SendMessageDTO, UpdateMessageDTO } from '@gomin/common';


@Injectable()
export class MessageService {
  constructor(private readonly messageRepo: MessageRepository) {}

  async sendMessage(data: SendMessageDTO) {
    return await this.messageRepo.createMessage({
      chatId: data.chatId,
      content: data.content,
      senderId: data.executorId,
      replyToId: data.replyToId,
    })
  }

  async updateMessage(data: UpdateMessageDTO) {
    return await this.messageRepo.updateMessage(data.messageId, {
      content: data.content,
      isPinned: data.isPinned,
      isEdited: true,
    })
  }

  async deleteMessage(messageId: string) {
    await this.messageRepo.deleteMessage(messageId);
  }

  async readMessages(data: ReadMessagesDTO) {
    await this.checkDoMessagesBelongsToChat(data.chatId, data.messageIds);
    await this.messageRepo.updateManyMessages({
      where: {
        id: {
          in: data.messageIds,
        },
      },
      data: {
        status: 'READ',
      },
    });
    return { message: 'Messages successfuly read' };
  }

  private async checkDoMessagesBelongsToChat(chatId: string, messageIds: string[]) {
    const messageIdsSet = new Set(messageIds)
    const messages = await this.messageRepo.findMessages({
      where: {
        id: {
          in: Array.from(messageIdsSet)
        },
        chatId,
      },
    });
    if (messages.length !== messageIdsSet.size) {
      throw new MicroserviceException('Messages doesn\'t belongs to chat', HttpStatus.BAD_REQUEST);
    }
    const messageMismatch = messages.some((message) => message.chatId !== chatId);
    if (messageMismatch) {
      throw new MicroserviceException('Message doesn\'t belongs to chat', HttpStatus.BAD_REQUEST);
    }
  }
}