import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectConnection } from 'nest-knexjs';
import type { MessageReactionDb } from './types/message-reaction.db';
import type { MessageReactionDomainModel } from './types/message-reaction.domain.model';
import { MessageReactionMapper } from './message-reaction.mapper';
import { TABLE_MESSAGE_REACTIONS } from '../../database/table-names';

@Injectable()
export class MessageReactionRepository {
  private readonly table = TABLE_MESSAGE_REACTIONS;

  constructor(@InjectConnection() private readonly knex: Knex) {}

  async findByMessage(
    messageId: string,
  ): Promise<MessageReactionDomainModel[]> {
    const rows = await this.knex<MessageReactionDb>(this.table).where({
      messageId,
    });
    return rows.map(MessageReactionMapper.toDomain);
  }

  async add(
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<MessageReactionDomainModel> {
    const [row] = await this.knex<MessageReactionDb>(this.table)
      .insert({ messageId, userId, emoji, createdAt: new Date() })
      .onConflict(['messageId', 'userId', 'emoji'])
      .ignore()
      .returning('*');

    if (!row) {
      const existing = await this.knex<MessageReactionDb>(this.table)
        .where({ messageId, userId, emoji })
        .first();
      return MessageReactionMapper.toDomain(existing!);
    }

    return MessageReactionMapper.toDomain(row);
  }

  async remove(
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<boolean> {
    const count = await this.knex<MessageReactionDb>(this.table)
      .where({ messageId, userId, emoji })
      .delete();
    return count > 0;
  }
}
