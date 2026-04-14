import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectConnection } from 'nest-knexjs';
import type { ChatMemberDb } from './types/chat-member.db';
import type {
  ChatMemberDomainModel,
  DomainChatMemberRole,
} from './types/chat-member.domain.model';
import { ChatMemberMapper } from './chat-member.mapper';
import { TABLE_CHAT_MEMBERS } from '../../database/table-names';

export interface AddMemberParams {
  chatId: string;
  userId: string;
  role: DomainChatMemberRole;
  canReadFrom: Date | null;
}

@Injectable()
export class ChatMemberRepository {
  private readonly table = TABLE_CHAT_MEMBERS;

  constructor(@InjectConnection() private readonly knex: Knex) {}

  async findActive(
    chatId: string,
    userId: string,
  ): Promise<ChatMemberDomainModel | null> {
    const row = await this.knex<ChatMemberDb>(this.table)
      .where({ chatId, userId })
      .whereNull('leftAt')
      .first();
    return row ? ChatMemberMapper.toDomain(row) : null;
  }

  async findAllActive(chatId: string): Promise<ChatMemberDomainModel[]> {
    const rows = await this.knex<ChatMemberDb>(this.table)
      .where({ chatId })
      .whereNull('leftAt');
    return rows.map(ChatMemberMapper.toDomain);
  }

  async add(params: AddMemberParams): Promise<ChatMemberDomainModel> {
    const now = new Date();
    const [row] = await this.knex<ChatMemberDb>(this.table)
      .insert({
        chatId: params.chatId,
        userId: params.userId,
        role: params.role,
        joinedAt: now,
        canReadFrom: params.canReadFrom,
        leftAt: null,
      })
      .returning('*');
    return ChatMemberMapper.toDomain(row);
  }

  async remove(chatId: string, userId: string): Promise<boolean> {
    const count = await this.knex<ChatMemberDb>(this.table)
      .where({ chatId, userId })
      .whereNull('leftAt')
      .update({ leftAt: new Date() });
    return count > 0;
  }

  async updateRole(
    chatId: string,
    userId: string,
    role: DomainChatMemberRole,
  ): Promise<ChatMemberDomainModel | null> {
    const [row] = await this.knex<ChatMemberDb>(this.table)
      .where({ chatId, userId })
      .whereNull('leftAt')
      .update({ role })
      .returning('*');
    return row ? ChatMemberMapper.toDomain(row) : null;
  }

  async isMember(chatId: string, userId: string): Promise<boolean> {
    const row = await this.findActive(chatId, userId);
    return row !== null;
  }
}
