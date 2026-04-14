import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectConnection } from 'nest-knexjs';
import type { SenderKeyDb } from './types/sender-key.db';
import type { SenderKeyDomainModel } from './types/sender-key.domain.model';
import { SenderKeyMapper } from './sender-key.mapper';
import { TABLE_SENDER_KEYS } from '../../database/table-names';

export interface SenderKeyEntry {
  senderId: string;
  recipientId: string;
  encryptedSenderKey: string;
  keyVersion: number;
}

@Injectable()
export class SenderKeyRepository {
  private readonly table = TABLE_SENDER_KEYS;

  constructor(@InjectConnection() private readonly knex: Knex) {}

  async upsertMany(chatId: string, keys: SenderKeyEntry[]): Promise<void> {
    if (keys.length === 0) return;
    const now = new Date();
    const rows = keys.map((k) => ({
      chatId,
      senderId: k.senderId,
      recipientId: k.recipientId,
      encryptedSenderKey: k.encryptedSenderKey,
      keyVersion: k.keyVersion,
      createdAt: now,
      updatedAt: now,
    }));
    await this.knex<SenderKeyDb>(this.table)
      .insert(rows)
      .onConflict(['chatId', 'senderId', 'recipientId'])
      .merge(['encryptedSenderKey', 'keyVersion', 'updatedAt']);
  }

  async findBySenderAndRecipient(
    chatId: string,
    senderId: string,
    recipientId: string,
  ): Promise<SenderKeyDomainModel | null> {
    const row = await this.knex<SenderKeyDb>(this.table)
      .where({ chatId, senderId, recipientId })
      .first();
    return row ? SenderKeyMapper.toDomain(row) : null;
  }

  async findByChatAndRecipient(
    chatId: string,
    recipientId: string,
  ): Promise<SenderKeyDomainModel[]> {
    const rows = await this.knex<SenderKeyDb>(this.table).where({
      chatId,
      recipientId,
    });
    return rows.map(SenderKeyMapper.toDomain);
  }
}
