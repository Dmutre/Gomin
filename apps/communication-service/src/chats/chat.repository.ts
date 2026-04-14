import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectConnection } from 'nest-knexjs';
import { randomUUID } from 'crypto';
import type { ChatDb } from './types/chat.db';
import type {
  ChatDomainModel,
  DomainChatType,
} from './types/chat.domain.model';
import { ChatMapper } from './chat.mapper';
import { TABLE_CHAT_MEMBERS, TABLE_CHATS } from '../../database/table-names';

export interface CreateChatParams {
  type: DomainChatType;
  name: string | null;
}

@Injectable()
export class ChatRepository {
  private readonly table = TABLE_CHATS;

  constructor(@InjectConnection() private readonly knex: Knex) {}

  async findById(id: string): Promise<ChatDomainModel | null> {
    const row = await this.knex<ChatDb>(this.table).where({ id }).first();
    return row ? ChatMapper.toDomain(row) : null;
  }

  async findByUserId(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<ChatDomainModel[]> {
    const rows = await this.knex<ChatDb>(this.table)
      .join(
        TABLE_CHAT_MEMBERS,
        `${TABLE_CHATS}.id`,
        `${TABLE_CHAT_MEMBERS}.chatId`,
      )
      .where(`${TABLE_CHAT_MEMBERS}.userId`, userId)
      .whereNull(`${TABLE_CHAT_MEMBERS}.leftAt`)
      .select(`${TABLE_CHATS}.*`)
      .orderBy(`${TABLE_CHATS}.updatedAt`, 'desc')
      .limit(limit)
      .offset(offset);
    return rows.map(ChatMapper.toDomain);
  }

  async create(params: CreateChatParams): Promise<ChatDomainModel> {
    const now = new Date();
    const [row] = await this.knex<ChatDb>(this.table)
      .insert({
        id: randomUUID(),
        type: params.type,
        name: params.name,
        keyVersion: 1,
        createdAt: now,
        updatedAt: now,
      })
      .returning('*');
    return ChatMapper.toDomain(row);
  }

  async incrementKeyVersion(id: string): Promise<void> {
    await this.knex<ChatDb>(this.table)
      .where({ id })
      .update({
        keyVersion: this.knex.raw('?? + 1', ['keyVersion']),
        updatedAt: new Date(),
      });
  }

  async touchUpdatedAt(id: string): Promise<void> {
    await this.knex<ChatDb>(this.table)
      .where({ id })
      .update({ updatedAt: new Date() });
  }
}
