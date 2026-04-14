import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectConnection } from 'nest-knexjs';
import type { MessageStatusDb } from './types/message-status.db';
import type { MessageStatusDomainModel } from './types/message-status.domain.model';
import { MessageStatusMapper } from './message-status.mapper';
import {
  TABLE_MESSAGES,
  TABLE_MESSAGE_STATUS,
} from '../../database/table-names';

@Injectable()
export class MessageStatusRepository {
  private readonly table = TABLE_MESSAGE_STATUS;

  constructor(@InjectConnection() private readonly knex: Knex) {}

  async findByMessage(messageId: string): Promise<MessageStatusDomainModel[]> {
    const rows = await this.knex<MessageStatusDb>(this.table).where({
      messageId,
    });
    return rows.map(MessageStatusMapper.toDomain);
  }

  async upsertSent(messageId: string, userId: string): Promise<void> {
    await this.knex<MessageStatusDb>(this.table)
      .insert({
        messageId,
        userId,
        status: 'SENT',
        deliveredAt: null,
        readAt: null,
      })
      .onConflict(['messageId', 'userId'])
      .ignore();
  }

  async markDelivered(messageId: string, userId: string): Promise<void> {
    await this.knex<MessageStatusDb>(this.table)
      .where({ messageId, userId })
      .update({ status: 'DELIVERED', deliveredAt: new Date() });
  }

  async markReadUpTo(
    chatId: string,
    userId: string,
    upToMessageId: string,
  ): Promise<void> {
    const cursor = await this.knex(TABLE_MESSAGES)
      .where({ id: upToMessageId })
      .select('createdAt')
      .first();

    if (!cursor) return;

    const messageIds = await this.knex(TABLE_MESSAGES)
      .where({ chatId })
      .where('createdAt', '<=', cursor.createdAt)
      .select('id');

    const ids = messageIds.map((r: { id: string }) => r.id);
    if (ids.length === 0) return;

    const now = new Date();
    await this.knex<MessageStatusDb>(this.table)
      .whereIn('messageId', ids)
      .where({ userId })
      .whereNot({ status: 'READ' })
      .update({ status: 'READ', readAt: now });
  }
}
