import type { ChatMemberDb } from './types/chat-member.db';
import type { ChatMemberDomainModel } from './types/chat-member.domain.model';

export class ChatMemberMapper {
  static toDomain(db: ChatMemberDb): ChatMemberDomainModel {
    return {
      chatId: db.chatId,
      userId: db.userId,
      role: db.role,
      joinedAt: db.joinedAt,
      canReadFrom: db.canReadFrom,
      leftAt: db.leftAt,
    };
  }

  static toDb(domain: ChatMemberDomainModel): ChatMemberDb {
    return {
      chatId: domain.chatId,
      userId: domain.userId,
      role: domain.role,
      joinedAt: domain.joinedAt,
      canReadFrom: domain.canReadFrom,
      leftAt: domain.leftAt,
    };
  }
}
