import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectConnection } from 'nest-knexjs';
import { RedisService } from '@gomin/redis';
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

const MEMBERS_TTL_SECONDS = 120;

@Injectable()
export class ChatMemberRepository {
  private readonly table = TABLE_CHAT_MEMBERS;

  constructor(
    @InjectConnection() private readonly knex: Knex,
    private readonly redis: RedisService,
  ) {}

  private membersCacheKey(chatId: string): string {
    return `chat:members:${chatId}`;
  }

  private async invalidateMembersCache(chatId: string): Promise<void> {
    await this.redis.del(this.membersCacheKey(chatId));
  }

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
    const cached = await this.redis.get(this.membersCacheKey(chatId));
    if (cached) return JSON.parse(cached) as ChatMemberDomainModel[];

    const rows = await this.knex<ChatMemberDb>(this.table)
      .where({ chatId })
      .whereNull('leftAt');
    const models = rows.map(ChatMemberMapper.toDomain);
    await this.redis.set(
      this.membersCacheKey(chatId),
      JSON.stringify(models),
      MEMBERS_TTL_SECONDS,
    );
    return models;
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
    await this.invalidateMembersCache(params.chatId);
    return ChatMemberMapper.toDomain(row);
  }

  async addMany(params: AddMemberParams[]): Promise<ChatMemberDomainModel[]> {
    if (params.length === 0) return [];
    const now = new Date();
    const rows = await this.knex<ChatMemberDb>(this.table)
      .insert(
        params.map((p) => ({
          chatId: p.chatId,
          userId: p.userId,
          role: p.role,
          joinedAt: now,
          canReadFrom: p.canReadFrom,
          leftAt: null,
        })),
      )
      .returning('*');
    await this.invalidateMembersCache(params[0].chatId);
    return rows.map(ChatMemberMapper.toDomain);
  }

  async remove(chatId: string, userId: string): Promise<boolean> {
    const count = await this.knex<ChatMemberDb>(this.table)
      .where({ chatId, userId })
      .whereNull('leftAt')
      .update({ leftAt: new Date() });
    if (count > 0) await this.invalidateMembersCache(chatId);
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
    if (row) await this.invalidateMembersCache(chatId);
    return row ? ChatMemberMapper.toDomain(row) : null;
  }

  async isMember(chatId: string, userId: string): Promise<boolean> {
    const row = await this.findActive(chatId, userId);
    return row !== null;
  }
}
