import { Injectable } from '@nestjs/common';
import { Metadata } from '@grpc/grpc-js';
import { MicroserviceIdentityAuthService } from '@gomin/service-identity';
import { CommunicationGrpcClient } from '@gomin/grpc';
import { RedisPubSubService } from '../websocket/redis-pubsub.service';
import type { SendMessageDto } from './dto/send-message.dto';
import type { UpdateMessageDto } from './dto/update-message.dto';
import type { AddReactionDto } from './dto/add-reaction.dto';
import type { MarkAsReadDto } from './dto/mark-as-read.dto';

@Injectable()
export class MessagesService {
  constructor(
    private readonly communicationClient: CommunicationGrpcClient,
    private readonly identityAuthService: MicroserviceIdentityAuthService,
    private readonly pubSub: RedisPubSubService,
  ) {}

  private async buildMetadata(): Promise<Metadata> {
    const token = await this.identityAuthService.getAccessToken();
    const metadata = new Metadata();
    if (token) metadata.add('authorization', `Bearer ${token}`);
    return metadata;
  }

  async sendMessage(userId: string, chatId: string, dto: SendMessageDto) {
    const metadata = await this.buildMetadata();
    const result = await this.communicationClient.sendMessage(
      {
        chatId,
        senderId: userId,
        payload: dto.payload,
        type: dto.type,
        replyToId: dto.replyToId ?? '',
      },
      metadata,
    );

    await this.pubSub.publish(this.pubSub.chatChannel(chatId), {
      event: 'message:new',
      chatId,
      data: result,
    });

    return result;
  }

  async getMessages(
    userId: string,
    chatId: string,
    limit = 50,
    beforeMessageId?: string,
  ) {
    const metadata = await this.buildMetadata();
    return this.communicationClient.getMessages(
      { chatId, userId, limit, beforeMessageId: beforeMessageId ?? '' },
      metadata,
    );
  }

  async updateMessage(
    userId: string,
    chatId: string,
    messageId: string,
    dto: UpdateMessageDto,
  ) {
    const metadata = await this.buildMetadata();
    const result = await this.communicationClient.updateMessage(
      { messageId, senderId: userId, payload: dto.payload },
      metadata,
    );

    await this.pubSub.publish(this.pubSub.chatChannel(chatId), {
      event: 'message:updated',
      chatId,
      data: result,
    });

    return result;
  }

  async deleteMessage(userId: string, chatId: string, messageId: string) {
    const metadata = await this.buildMetadata();
    const result = await this.communicationClient.deleteMessage(
      { messageId, requestingUserId: userId },
      metadata,
    );

    await this.pubSub.publish(this.pubSub.chatChannel(chatId), {
      event: 'message:deleted',
      chatId,
      data: { messageId, chatId, deletedBy: userId },
    });

    return result;
  }

  async markAsRead(userId: string, chatId: string, dto: MarkAsReadDto) {
    const metadata = await this.buildMetadata();
    const result = await this.communicationClient.markAsRead(
      { chatId, userId, upToMessageId: dto.upToMessageId },
      metadata,
    );

    await this.pubSub.publish(this.pubSub.chatChannel(chatId), {
      event: 'message:read_receipt',
      chatId,
      data: { chatId, userId, upToMessageId: dto.upToMessageId },
    });

    return result;
  }

  async addReaction(
    userId: string,
    chatId: string,
    messageId: string,
    dto: AddReactionDto,
  ) {
    const metadata = await this.buildMetadata();
    const result = await this.communicationClient.addReaction(
      { messageId, userId, emoji: dto.emoji },
      metadata,
    );

    await this.pubSub.publish(this.pubSub.chatChannel(chatId), {
      event: 'message:reaction_added',
      chatId,
      data: { chatId, messageId, userId, emoji: dto.emoji },
    });

    return result;
  }

  async removeReaction(
    userId: string,
    chatId: string,
    messageId: string,
    emoji: string,
  ) {
    const metadata = await this.buildMetadata();
    const result = await this.communicationClient.removeReaction(
      { messageId, userId, emoji },
      metadata,
    );

    await this.pubSub.publish(this.pubSub.chatChannel(chatId), {
      event: 'message:reaction_removed',
      chatId,
      data: { chatId, messageId, userId, emoji },
    });

    return result;
  }
}
