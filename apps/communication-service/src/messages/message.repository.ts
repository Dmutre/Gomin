import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectConnection } from 'nest-knexjs';
import { randomUUID } from 'crypto';
import type { MessageDb, MessageTypeDb } from './types/message.db';
import type { MessageDomainModel } from './types/message.domain.model';
import { MessageMapper } from './message.mapper';
import { TABLE_MESSAGES } from '../../database/table-names';

export interface CreateMessageParams {
  chatId: string;
  senderId: string;
  encryptedContent: string;
  iv: string;
  authTag: string;
  keyVersion: number;
  iteration: number;
  type: MessageTypeDb;
  replyToId: string | null;
}

export interface UpdateMessageParams {
  encryptedContent: string;
  iv: string;
  authTag: string;
  keyVersion: number;
  iteration: number;
}

@Injectable()
export class MessageRepository {
  private readonly table = TABLE_MESSAGES;

  constructor(@InjectConnection() private readonly knex: Knex) {}

  async findById(id: string): Promise<MessageDomainModel | null> {
    const row = await this.knex<MessageDb>(this.table).where({ id }).first();
    return row ? MessageMapper.toDomain(row) : null;
  }

  async findByChatId(
    chatId: string,
    limit: number,
    beforeId: string | null,
    canReadFrom: Date | null,
  ): Promise<MessageDomainModel[]> {
    let query = this.knex<MessageDb>(this.table)
      .where({ chatId })
      .where('isDeleted', false)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (beforeId) {
      const cursor = await this.knex<MessageDb>(this.table)
        .where({ id: beforeId })
        .select('createdAt')
        .first();
      if (cursor) {
        query = query.where('createdAt', '<', cursor.createdAt);
      }
    }

    if (canReadFrom) {
      query = query.where('createdAt', '>=', canReadFrom);
    }

    const rows = await query;
    return rows.map(MessageMapper.toDomain);
  }

  async create(params: CreateMessageParams): Promise<MessageDomainModel> {
    const now = new Date();
    const [row] = await this.knex<MessageDb>(this.table)
      .insert({
        id: randomUUID(),
        chatId: params.chatId,
        senderId: params.senderId,
        encryptedContent: params.encryptedContent,
        iv: params.iv,
        authTag: params.authTag,
        keyVersion: params.keyVersion,
        iteration: params.iteration,
        type: params.type,
        isEdited: false,
        isDeleted: false,
        deletedAt: null,
        replyToId: params.replyToId,
        createdAt: now,
        updatedAt: now,
      })
      .returning('*');
    return MessageMapper.toDomain(row);
  }

  async update(
    id: string,
    params: UpdateMessageParams,
  ): Promise<MessageDomainModel | null> {
    const [row] = await this.knex<MessageDb>(this.table)
      .where({ id })
      .update({
        encryptedContent: params.encryptedContent,
        iv: params.iv,
        authTag: params.authTag,
        keyVersion: params.keyVersion,
        iteration: params.iteration,
        isEdited: true,
        updatedAt: new Date(),
      })
      .returning('*');
    return row ? MessageMapper.toDomain(row) : null;
  }

  async softDelete(id: string): Promise<boolean> {
    const now = new Date();
    const count = await this.knex<MessageDb>(this.table)
      .where({ id })
      .update({ isDeleted: true, deletedAt: now, updatedAt: now });
    return count > 0;
  }
}
