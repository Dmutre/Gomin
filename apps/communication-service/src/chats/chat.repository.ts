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
import {
  TABLE_CHAT_MEMBERS,
  TABLE_CHATS,
  TABLE_MESSAGES,
  TABLE_MESSAGE_STATUS,
} from '../../database/table-names';

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

  async findDirectBetween(
    userIdA: string,
    userIdB: string,
  ): Promise<ChatDomainModel | null> {
    const bChatIds = this.knex(TABLE_CHAT_MEMBERS)
      .select('chatId')
      .where('userId', userIdB)
      .whereNull('leftAt');

    const row = await this.knex<ChatDb>(this.table)
      .join(
        TABLE_CHAT_MEMBERS,
        `${TABLE_CHATS}.id`,
        `${TABLE_CHAT_MEMBERS}.chatId`,
      )
      .where(`${TABLE_CHATS}.type`, 'DIRECT')
      .where(`${TABLE_CHAT_MEMBERS}.userId`, userIdA)
      .whereNull(`${TABLE_CHAT_MEMBERS}.leftAt`)
      .whereIn(`${TABLE_CHATS}.id`, bChatIds)
      .select(`${TABLE_CHATS}.*`)
      .first();
    return row ? ChatMapper.toDomain(row) : null;
  }

  async countUnread(chatId: string, userId: string): Promise<number> {
    const result = await this.knex(TABLE_MESSAGE_STATUS)
      .join(
        TABLE_MESSAGES,
        `${TABLE_MESSAGE_STATUS}.messageId`,
        `${TABLE_MESSAGES}.id`,
      )
      .where(`${TABLE_MESSAGES}.chatId`, chatId)
      .where(`${TABLE_MESSAGE_STATUS}.userId`, userId)
      .whereNot(`${TABLE_MESSAGE_STATUS}.status`, 'READ')
      .count('* as count')
      .first();
    return Number((result as { count: string | number } | undefined)?.count ?? 0);
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

  async deleteById(id: string): Promise<void> {
    await this.knex<ChatDb>(this.table).where({ id }).delete();
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
