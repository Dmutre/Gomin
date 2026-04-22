import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { MicroserviceException } from '@gomin/app';
import { status } from '@grpc/grpc-js';
import type {
  MessageDomainModel,
  DomainMessageType,
} from './types/message.domain.model';
import type { SenderKeyDomainModel } from './types/sender-key.domain.model';
import type { MessageStatusDomainModel } from './types/message-status.domain.model';
import type { MessageReactionDomainModel } from './types/message-reaction.domain.model';
import { MessageRepository } from './message.repository';
import {
  SenderKeyRepository,
  type SenderKeyEntry,
} from './sender-key.repository';
import { MessageStatusRepository } from './message-status.repository';
import { MessageReactionRepository } from './message-reaction.repository';
import { ChatMemberRepository } from '../chats/chat-member.repository';
import { ChatRepository } from '../chats/chat.repository';

export interface SendMessageOptions {
  chatId: string;
  senderId: string;
  encryptedContent: string;
  iv: string;
  authTag: string;
  keyVersion: number;
  iteration: number;
  type: DomainMessageType;
  replyToId: string | null;
}

export interface UpdateMessageOptions {
  messageId: string;
  senderId: string;
  encryptedContent: string;
  iv: string;
  authTag: string;
  keyVersion: number;
  iteration: number;
}

export interface FullMessage {
  message: MessageDomainModel;
  reactions: MessageReactionDomainModel[];
  statuses: MessageStatusDomainModel[];
}

@Injectable()
export class MessageService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly messageRepo: MessageRepository,
    private readonly senderKeyRepo: SenderKeyRepository,
    private readonly statusRepo: MessageStatusRepository,
    private readonly reactionRepo: MessageReactionRepository,
    private readonly memberRepo: ChatMemberRepository,
    private readonly chatRepo: ChatRepository,
  ) {}

  async sendMessage(options: SendMessageOptions): Promise<FullMessage> {
    const isMember = await this.memberRepo.isMember(
      options.chatId,
      options.senderId,
    );
    if (!isMember) {
      throw new MicroserviceException(
        'Not a chat member',
        status.PERMISSION_DENIED,
      );
    }

    const message = await this.messageRepo.create({
      chatId: options.chatId,
      senderId: options.senderId,
      encryptedContent: options.encryptedContent,
      iv: options.iv,
      authTag: options.authTag,
      keyVersion: options.keyVersion,
      iteration: options.iteration,
      type: options.type,
      replyToId: options.replyToId,
    });

    await this.chatRepo.touchUpdatedAt(options.chatId);

    const members = await this.memberRepo.findAllActive(options.chatId);
    await this.statusRepo.upsertManySent(
      message.id,
      members.map((m) => m.userId),
    );

    this.logger.info(
      {
        messageId: message.id,
        chatId: options.chatId,
        senderId: options.senderId,
        type: options.type,
        keyVersion: options.keyVersion,
        iteration: options.iteration,
        recipientCount: members.length,
      },
      'Message sent',
    );

    return {
      message,
      reactions: [],
      statuses: await this.statusRepo.findByMessage(message.id),
    };
  }

  async getMessages(
    chatId: string,
    userId: string,
    limit: number,
    beforeMessageId: string | null,
  ): Promise<{ messages: FullMessage[]; hasMore: boolean }> {
    const member = await this.memberRepo.findActive(chatId, userId);
    if (!member) {
      throw new MicroserviceException(
        'Not a chat member',
        status.PERMISSION_DENIED,
      );
    }

    const fetchLimit = limit + 1;
    const rows = await this.messageRepo.findByChatId(
      chatId,
      fetchLimit,
      beforeMessageId,
      member.canReadFrom,
    );
    const hasMore = rows.length > limit;
    const messages = rows.slice(0, limit);

    const full = await Promise.all(messages.map((msg) => this.hydrate(msg)));
    return { messages: full, hasMore };
  }

  async updateMessage(options: UpdateMessageOptions): Promise<FullMessage> {
    const message = await this.messageRepo.findById(options.messageId);
    if (!message) {
      throw new MicroserviceException('Message not found', status.NOT_FOUND);
    }
    if (message.senderId !== options.senderId) {
      throw new MicroserviceException(
        "Cannot edit another user's message",
        status.PERMISSION_DENIED,
      );
    }
    if (message.isDeleted) {
      throw new MicroserviceException(
        'Message is deleted',
        status.FAILED_PRECONDITION,
      );
    }

    const updated = await this.messageRepo.update(options.messageId, {
      encryptedContent: options.encryptedContent,
      iv: options.iv,
      authTag: options.authTag,
      keyVersion: options.keyVersion,
      iteration: options.iteration,
    });

    this.logger.info(
      {
        messageId: options.messageId,
        chatId: message.chatId,
        editedBy: options.senderId,
      },
      'Message edited',
    );

    return this.hydrate(updated!);
  }

  async deleteMessage(
    messageId: string,
    requestingUserId: string,
  ): Promise<void> {
    const message = await this.messageRepo.findById(messageId);
    if (!message) {
      throw new MicroserviceException('Message not found', status.NOT_FOUND);
    }

    const member = await this.memberRepo.findActive(
      message.chatId,
      requestingUserId,
    );
    const isAuthor = message.senderId === requestingUserId;
    const isAdmin = member?.role === 'OWNER' || member?.role === 'ADMIN';

    if (!isAuthor && !isAdmin) {
      throw new MicroserviceException(
        'Cannot delete this message',
        status.PERMISSION_DENIED,
      );
    }

    await this.messageRepo.softDelete(messageId);

    this.logger.info(
      {
        messageId,
        chatId: message.chatId,
        deletedBy: requestingUserId,
        isAuthor,
      },
      'Message deleted',
    );
  }

  async markAsRead(
    chatId: string,
    userId: string,
    upToMessageId: string,
  ): Promise<void> {
    const isMember = await this.memberRepo.isMember(chatId, userId);
    if (!isMember) {
      throw new MicroserviceException(
        'Not a chat member',
        status.PERMISSION_DENIED,
      );
    }
    await this.statusRepo.markReadUpTo(chatId, userId, upToMessageId);
  }

  async addReaction(
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<MessageReactionDomainModel> {
    const message = await this.messageRepo.findById(messageId);
    if (!message) {
      throw new MicroserviceException('Message not found', status.NOT_FOUND);
    }
    const isMember = await this.memberRepo.isMember(message.chatId, userId);
    if (!isMember) {
      throw new MicroserviceException(
        'Not a chat member',
        status.PERMISSION_DENIED,
      );
    }
    return this.reactionRepo.add(messageId, userId, emoji);
  }

  async removeReaction(
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<void> {
    const removed = await this.reactionRepo.remove(messageId, userId, emoji);
    if (!removed) {
      throw new MicroserviceException('Reaction not found', status.NOT_FOUND);
    }
  }

  async storeSenderKeys(chatId: string, keys: SenderKeyEntry[]): Promise<void> {
    await this.senderKeyRepo.upsertMany(chatId, keys);

    this.logger.info({ chatId, keyCount: keys.length }, 'Sender keys stored');
  }

  async getSenderKey(
    chatId: string,
    senderId: string,
    recipientId: string,
  ): Promise<SenderKeyDomainModel> {
    const key = await this.senderKeyRepo.findBySenderAndRecipient(
      chatId,
      senderId,
      recipientId,
    );
    if (!key) {
      throw new MicroserviceException('Sender key not found', status.NOT_FOUND);
    }
    return key;
  }

  async getChatSenderKeys(
    chatId: string,
    userId: string,
  ): Promise<SenderKeyDomainModel[]> {
    const isMember = await this.memberRepo.isMember(chatId, userId);
    if (!isMember) {
      throw new MicroserviceException(
        'Not a chat member',
        status.PERMISSION_DENIED,
      );
    }
    return this.senderKeyRepo.findByChatAndRecipient(chatId, userId);
  }

  private async hydrate(message: MessageDomainModel): Promise<FullMessage> {
    const [reactions, statuses] = await Promise.all([
      this.reactionRepo.findByMessage(message.id),
      this.statusRepo.findByMessage(message.id),
    ]);
    return { message, reactions, statuses };
  }
}
