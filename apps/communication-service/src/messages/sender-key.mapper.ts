import type { SenderKeyDb } from './types/sender-key.db';
import type { SenderKeyDomainModel } from './types/sender-key.domain.model';

export class SenderKeyMapper {
  static toDomain(db: SenderKeyDb): SenderKeyDomainModel {
    return {
      chatId: db.chatId,
      senderId: db.senderId,
      recipientId: db.recipientId,
      encryptedSenderKey: db.encryptedSenderKey,
      keyVersion: db.keyVersion,
      createdAt: db.createdAt,
      updatedAt: db.updatedAt,
    };
  }

  static toDb(domain: SenderKeyDomainModel): SenderKeyDb {
    return {
      chatId: domain.chatId,
      senderId: domain.senderId,
      recipientId: domain.recipientId,
      encryptedSenderKey: domain.encryptedSenderKey,
      keyVersion: domain.keyVersion,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
