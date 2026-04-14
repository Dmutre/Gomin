import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  MicroserviceIdentityGuard,
  Permission,
  RequirePermission,
} from '@gomin/service-identity';
import { MessageService } from './message.service';
import { MessageGrpcMapper } from './message.grpc.mapper';
import type {
  SendMessageRequest,
  MessageResponse,
  GetMessagesRequest,
  MessagesResponse,
  UpdateMessageRequest,
  DeleteMessageRequest,
  MarkAsReadRequest,
  AddReactionRequest,
  ReactionResponse,
  RemoveReactionRequest,
  StoreSenderKeysRequest,
  GetSenderKeyRequest,
  SenderKeyResponse,
  GetChatSenderKeysRequest,
  ChatSenderKeysResponse,
  StatusResponse,
} from '@gomin/grpc';

@Controller()
@UseGuards(MicroserviceIdentityGuard)
export class MessageGrpcController {
  constructor(private readonly messageService: MessageService) {}

  @GrpcMethod('CommunicationService', 'SendMessage')
  @RequirePermission(Permission.COMMUNICATION_MESSAGES_WRITE)
  async sendMessage(data: SendMessageRequest): Promise<MessageResponse> {
    const payload = data.payload!;
    const full = await this.messageService.sendMessage({
      chatId: data.chatId,
      senderId: data.senderId,
      encryptedContent: payload.encryptedContent,
      iv: payload.iv,
      authTag: payload.authTag,
      keyVersion: payload.keyVersion,
      iteration: payload.iteration,
      type: MessageGrpcMapper.messageTypeFromProto(data.type),
      replyToId: data.replyToId || null,
    });
    return { message: MessageGrpcMapper.fullMessageToProto(full) };
  }

  @GrpcMethod('CommunicationService', 'GetMessages')
  @RequirePermission(Permission.COMMUNICATION_MESSAGES_READ)
  async getMessages(data: GetMessagesRequest): Promise<MessagesResponse> {
    const limit = data.limit > 0 ? data.limit : 50;
    const { messages, hasMore } = await this.messageService.getMessages(
      data.chatId,
      data.userId,
      limit,
      data.beforeMessageId || null,
    );
    return {
      messages: messages.map(MessageGrpcMapper.fullMessageToProto),
      hasMore,
    };
  }

  @GrpcMethod('CommunicationService', 'UpdateMessage')
  @RequirePermission(Permission.COMMUNICATION_MESSAGES_WRITE)
  async updateMessage(data: UpdateMessageRequest): Promise<MessageResponse> {
    const payload = data.payload!;
    const full = await this.messageService.updateMessage({
      messageId: data.messageId,
      senderId: data.senderId,
      encryptedContent: payload.encryptedContent,
      iv: payload.iv,
      authTag: payload.authTag,
      keyVersion: payload.keyVersion,
      iteration: payload.iteration,
    });
    return { message: MessageGrpcMapper.fullMessageToProto(full) };
  }

  @GrpcMethod('CommunicationService', 'DeleteMessage')
  @RequirePermission(Permission.COMMUNICATION_MESSAGES_DELETE)
  async deleteMessage(data: DeleteMessageRequest): Promise<StatusResponse> {
    await this.messageService.deleteMessage(
      data.messageId,
      data.requestingUserId,
    );
    return { success: true };
  }

  @GrpcMethod('CommunicationService', 'MarkAsRead')
  @RequirePermission(Permission.COMMUNICATION_MESSAGES_WRITE)
  async markAsRead(data: MarkAsReadRequest): Promise<StatusResponse> {
    await this.messageService.markAsRead(
      data.chatId,
      data.userId,
      data.upToMessageId,
    );
    return { success: true };
  }

  @GrpcMethod('CommunicationService', 'AddReaction')
  @RequirePermission(Permission.COMMUNICATION_MESSAGES_WRITE)
  async addReaction(data: AddReactionRequest): Promise<ReactionResponse> {
    const reaction = await this.messageService.addReaction(
      data.messageId,
      data.userId,
      data.emoji,
    );
    return { reaction: MessageGrpcMapper.reactionToProto(reaction) };
  }

  @GrpcMethod('CommunicationService', 'RemoveReaction')
  @RequirePermission(Permission.COMMUNICATION_MESSAGES_WRITE)
  async removeReaction(data: RemoveReactionRequest): Promise<StatusResponse> {
    await this.messageService.removeReaction(
      data.messageId,
      data.userId,
      data.emoji,
    );
    return { success: true };
  }

  @GrpcMethod('CommunicationService', 'StoreSenderKeys')
  @RequirePermission(Permission.COMMUNICATION_MESSAGE_KEYS_WRITE)
  async storeSenderKeys(data: StoreSenderKeysRequest): Promise<StatusResponse> {
    await this.messageService.storeSenderKeys(
      data.chatId,
      data.keys.map((k) => ({
        senderId: k.senderId,
        recipientId: k.recipientId,
        encryptedSenderKey: k.encryptedSenderKey,
        keyVersion: k.keyVersion,
      })),
    );
    return { success: true };
  }

  @GrpcMethod('CommunicationService', 'GetSenderKey')
  @RequirePermission(Permission.COMMUNICATION_MESSAGE_KEYS_READ)
  async getSenderKey(data: GetSenderKeyRequest): Promise<SenderKeyResponse> {
    const key = await this.messageService.getSenderKey(
      data.chatId,
      data.senderId,
      data.recipientId,
    );
    return {
      key: {
        senderId: key.senderId,
        recipientId: key.recipientId,
        encryptedSenderKey: key.encryptedSenderKey,
        keyVersion: key.keyVersion,
      },
    };
  }

  @GrpcMethod('CommunicationService', 'GetChatSenderKeys')
  @RequirePermission(Permission.COMMUNICATION_MESSAGE_KEYS_READ)
  async getChatSenderKeys(
    data: GetChatSenderKeysRequest,
  ): Promise<ChatSenderKeysResponse> {
    const keys = await this.messageService.getChatSenderKeys(
      data.chatId,
      data.userId,
    );
    return {
      keys: keys.map((k) => ({
        senderId: k.senderId,
        recipientId: k.recipientId,
        encryptedSenderKey: k.encryptedSenderKey,
        keyVersion: k.keyVersion,
      })),
    };
  }
}
