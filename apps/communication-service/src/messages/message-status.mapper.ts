import type { MessageStatusDb } from './types/message-status.db';
import type { MessageStatusDomainModel } from './types/message-status.domain.model';

export class MessageStatusMapper {
  static toDomain(db: MessageStatusDb): MessageStatusDomainModel {
    return {
      messageId: db.messageId,
      userId: db.userId,
      status: db.status,
      deliveredAt: db.deliveredAt,
      readAt: db.readAt,
    };
  }

  static toDb(domain: MessageStatusDomainModel): MessageStatusDb {
    return {
      messageId: domain.messageId,
      userId: domain.userId,
      status: domain.status,
      deliveredAt: domain.deliveredAt,
      readAt: domain.readAt,
    };
  }
}
