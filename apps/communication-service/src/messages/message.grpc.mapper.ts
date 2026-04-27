import {
  MessageType,
  MessageStatusEnum,
  type Message,
  type MessageReaction,
  type MessageStatusInfo,
} from '@gomin/grpc';
import type {
  MessageDomainModel,
  DomainMessageType,
} from './types/message.domain.model';
import type { MessageReactionDomainModel } from './types/message-reaction.domain.model';
import type {
  MessageStatusDomainModel,
  DomainMessageStatusValue,
} from './types/message-status.domain.model';
import type { FullMessage } from './message.service';

export class MessageGrpcMapper {
  static messageTypeToProto(type: DomainMessageType): MessageType {
    const map: Record<DomainMessageType, MessageType> = {
      TEXT: MessageType.MESSAGE_TYPE_TEXT,
      IMAGE: MessageType.MESSAGE_TYPE_IMAGE,
      VIDEO: MessageType.MESSAGE_TYPE_VIDEO,
      DOCUMENT: MessageType.MESSAGE_TYPE_DOCUMENT,
      VOICE: MessageType.MESSAGE_TYPE_VOICE,
      SYSTEM: MessageType.MESSAGE_TYPE_SYSTEM,
    };
    return map[type];
  }

  static messageTypeFromProto(type: MessageType): DomainMessageType {
    const map: Record<number, DomainMessageType> = {
      [MessageType.MESSAGE_TYPE_TEXT]: 'TEXT',
      [MessageType.MESSAGE_TYPE_IMAGE]: 'IMAGE',
      [MessageType.MESSAGE_TYPE_VIDEO]: 'VIDEO',
      [MessageType.MESSAGE_TYPE_DOCUMENT]: 'DOCUMENT',
      [MessageType.MESSAGE_TYPE_VOICE]: 'VOICE',
      [MessageType.MESSAGE_TYPE_SYSTEM]: 'SYSTEM',
    };
    return map[type] ?? 'TEXT';
  }

  static statusToProto(s: DomainMessageStatusValue): MessageStatusEnum {
    const map: Record<DomainMessageStatusValue, MessageStatusEnum> = {
      SENT: MessageStatusEnum.MESSAGE_STATUS_SENT,
      DELIVERED: MessageStatusEnum.MESSAGE_STATUS_DELIVERED,
      READ: MessageStatusEnum.MESSAGE_STATUS_READ,
    };
    return map[s];
  }

  static reactionToProto(r: MessageReactionDomainModel): MessageReaction {
    return { userId: r.userId, emoji: r.emoji, createdAt: r.createdAt };
  }

  static statusInfoToProto(s: MessageStatusDomainModel): MessageStatusInfo {
    return {
      userId: s.userId,
      status: MessageGrpcMapper.statusToProto(s.status),
      deliveredAt: s.deliveredAt ?? undefined,
      readAt: s.readAt ?? undefined,
    };
  }

  static dateToTimestamp(
    date: Date | undefined,
  ): { seconds: number; nanos: number } | undefined {
    if (!date) return undefined;
    const ms = date.getTime();
    return { seconds: Math.floor(ms / 1000), nanos: (ms % 1000) * 1_000_000 };
  }

  static fullMessageToProto(full: FullMessage): Message {
    const msg: MessageDomainModel = full.message;
    return {
      id: msg.id,
      chatId: msg.chatId,
      senderId: msg.senderId,
      payload: {
        encryptedContent: msg.encryptedContent,
        iv: msg.iv,
        authTag: msg.authTag,
        keyVersion: msg.keyVersion,
        iteration: msg.iteration,
      },
      type: MessageGrpcMapper.messageTypeToProto(msg.type),
      isEdited: msg.isEdited,
      isDeleted: msg.isDeleted,
      replyToId: msg.replyToId ?? '',
      reactions: full.reactions.map(MessageGrpcMapper.reactionToProto),
      statuses: full.statuses.map(MessageGrpcMapper.statusInfoToProto),
      createdAt: MessageGrpcMapper.dateToTimestamp(msg.createdAt) as unknown as Date,
      updatedAt: MessageGrpcMapper.dateToTimestamp(msg.updatedAt) as unknown as Date,
    };
  }
}
