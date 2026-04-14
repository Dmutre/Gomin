import type { MessageDb } from './types/message.db';
import type { MessageDomainModel } from './types/message.domain.model';

export class MessageMapper {
  static toDomain(db: MessageDb): MessageDomainModel {
    return {
      id: db.id,
      chatId: db.chatId,
      senderId: db.senderId,
      encryptedContent: db.encryptedContent,
      iv: db.iv,
      authTag: db.authTag,
      keyVersion: db.keyVersion,
      iteration: db.iteration,
      type: db.type,
      isEdited: db.isEdited,
      isDeleted: db.isDeleted,
      deletedAt: db.deletedAt,
      replyToId: db.replyToId,
      createdAt: db.createdAt,
      updatedAt: db.updatedAt,
    };
  }

  static toDb(domain: MessageDomainModel): MessageDb {
    return {
      id: domain.id,
      chatId: domain.chatId,
      senderId: domain.senderId,
      encryptedContent: domain.encryptedContent,
      iv: domain.iv,
      authTag: domain.authTag,
      keyVersion: domain.keyVersion,
      iteration: domain.iteration,
      type: domain.type,
      isEdited: domain.isEdited,
      isDeleted: domain.isDeleted,
      deletedAt: domain.deletedAt,
      replyToId: domain.replyToId,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
