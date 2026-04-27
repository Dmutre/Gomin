import {
  ChatType,
  ChatMemberRole,
  type Chat,
  type ChatMember,
} from '@gomin/grpc';
import type {
  ChatDomainModel,
  DomainChatType,
} from './types/chat.domain.model';
import type {
  ChatMemberDomainModel,
  DomainChatMemberRole,
} from './types/chat-member.domain.model';

export class ChatGrpcMapper {
  static chatTypeToProto(type: DomainChatType): ChatType {
    const map: Record<DomainChatType, ChatType> = {
      DIRECT: ChatType.CHAT_TYPE_DIRECT,
      GROUP: ChatType.CHAT_TYPE_GROUP,
      CHANNEL: ChatType.CHAT_TYPE_CHANNEL,
    };
    return map[type];
  }

  static chatTypeFromProto(type: ChatType): DomainChatType {
    const map: Record<number, DomainChatType> = {
      [ChatType.CHAT_TYPE_DIRECT]: 'DIRECT',
      [ChatType.CHAT_TYPE_GROUP]: 'GROUP',
      [ChatType.CHAT_TYPE_CHANNEL]: 'CHANNEL',
    };
    return map[type] ?? 'DIRECT';
  }

  static memberRoleToProto(role: DomainChatMemberRole): ChatMemberRole {
    const map: Record<DomainChatMemberRole, ChatMemberRole> = {
      OWNER: ChatMemberRole.CHAT_MEMBER_ROLE_OWNER,
      ADMIN: ChatMemberRole.CHAT_MEMBER_ROLE_ADMIN,
      MEMBER: ChatMemberRole.CHAT_MEMBER_ROLE_MEMBER,
    };
    return map[role];
  }

  static memberRoleFromProto(role: ChatMemberRole): DomainChatMemberRole {
    const map: Record<number, DomainChatMemberRole> = {
      [ChatMemberRole.CHAT_MEMBER_ROLE_OWNER]: 'OWNER',
      [ChatMemberRole.CHAT_MEMBER_ROLE_ADMIN]: 'ADMIN',
      [ChatMemberRole.CHAT_MEMBER_ROLE_MEMBER]: 'MEMBER',
    };
    return map[role] ?? 'MEMBER';
  }

  static memberToProto(member: ChatMemberDomainModel): ChatMember {
    return {
      userId: member.userId,
      role: ChatGrpcMapper.memberRoleToProto(member.role),
      joinedAt: member.joinedAt,
      canReadFrom: member.canReadFrom ?? undefined,
    };
  }

  static chatToProto(
    chat: ChatDomainModel,
    members: ChatMemberDomainModel[],
    unreadCount = 0,
  ): Chat {
    return {
      id: chat.id,
      type: ChatGrpcMapper.chatTypeToProto(chat.type),
      name: chat.name ?? '',
      keyVersion: chat.keyVersion,
      members: members.map(ChatGrpcMapper.memberToProto),
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      unreadCount,
    };
  }
}
