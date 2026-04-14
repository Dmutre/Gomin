import type { ChatDb } from './types/chat.db';
import type { ChatDomainModel } from './types/chat.domain.model';

export class ChatMapper {
  static toDomain(db: ChatDb): ChatDomainModel {
    return {
      id: db.id,
      type: db.type,
      name: db.name,
      keyVersion: db.keyVersion,
      createdAt: db.createdAt,
      updatedAt: db.updatedAt,
    };
  }

  static toDb(domain: ChatDomainModel): ChatDb {
    return {
      id: domain.id,
      type: domain.type,
      name: domain.name,
      keyVersion: domain.keyVersion,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
