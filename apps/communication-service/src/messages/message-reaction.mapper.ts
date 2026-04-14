import type { MessageReactionDb } from './types/message-reaction.db';
import type { MessageReactionDomainModel } from './types/message-reaction.domain.model';

export class MessageReactionMapper {
  static toDomain(db: MessageReactionDb): MessageReactionDomainModel {
    return {
      messageId: db.messageId,
      userId: db.userId,
      emoji: db.emoji,
      createdAt: db.createdAt,
    };
  }

  static toDb(domain: MessageReactionDomainModel): MessageReactionDb {
    return {
      messageId: domain.messageId,
      userId: domain.userId,
      emoji: domain.emoji,
      createdAt: domain.createdAt,
    };
  }
}
