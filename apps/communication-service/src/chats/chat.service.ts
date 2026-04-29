import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { LogAllMethods, MicroserviceException } from '@gomin/app';
import { status } from '@grpc/grpc-js';
import type {
  ChatDomainModel,
  DomainChatType,
} from './types/chat.domain.model';
import type {
  ChatMemberDomainModel,
  DomainChatMemberRole,
} from './types/chat-member.domain.model';
import { ChatRepository } from './chat.repository';
import { ChatMemberRepository } from './chat-member.repository';
import { CommunicationMetricsService } from '../metrics/communication.metrics.service';

export interface CreateChatOptions {
  type: DomainChatType;
  name: string | null;
  creatorUserId: string;
  memberUserIds: string[];
}

export interface AddMemberOptions {
  chatId: string;
  requestingUserId: string;
  targetUserId: string;
  role: DomainChatMemberRole;
  canReadFrom: Date | null;
}

export interface UpdateMemberRoleOptions {
  chatId: string;
  requestingUserId: string;
  targetUserId: string;
  newRole: Exclude<DomainChatMemberRole, 'OWNER'>;
}

@LogAllMethods()
@Injectable()
export class ChatService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly chatRepo: ChatRepository,
    private readonly memberRepo: ChatMemberRepository,
    private readonly commMetrics: CommunicationMetricsService,
  ) {}

  async createChat(
    options: CreateChatOptions,
  ): Promise<{ chat: ChatDomainModel; members: ChatMemberDomainModel[] }> {
    await this.assertNoDuplicateDirectChat(options);

    const chat = await this.chatRepo.create({
      type: options.type,
      name: options.name,
    });

    const otherUserIds = options.memberUserIds.filter(
      (id) => id !== options.creatorUserId,
    );
    const allMembers = await this.memberRepo.addMany([
      {
        chatId: chat.id,
        userId: options.creatorUserId,
        role: 'OWNER',
        canReadFrom: null,
      },
      ...otherUserIds.map((userId) => ({
        chatId: chat.id,
        userId,
        role: 'MEMBER' as const,
        canReadFrom: null,
      })),
    ]);
    const [creator, ...otherMembers] = allMembers;

    this.logger.info(
      {
        chatId: chat.id,
        type: chat.type,
        creatorUserId: options.creatorUserId,
        memberCount: 1 + otherMembers.length,
      },
      'Chat created',
    );

    this.commMetrics.recordChatCreated(chat.type);
    this.commMetrics.recordMembersAdded(allMembers.length);

    return { chat, members: [creator, ...otherMembers] };
  }

  private async assertNoDuplicateDirectChat(
    options: CreateChatOptions,
  ): Promise<void> {
    if (options.type !== 'DIRECT') return;

    const otherUserId = options.memberUserIds.find(
      (id) => id !== options.creatorUserId,
    );
    if (!otherUserId) return;

    const existing = await this.chatRepo.findDirectBetween(
      options.creatorUserId,
      otherUserId,
    );
    if (existing) {
      throw new MicroserviceException(
        `DIRECT_EXISTS:${existing.id}`,
        status.ALREADY_EXISTS,
      );
    }
  }

  async getChat(
    chatId: string,
    requestingUserId: string,
  ): Promise<{ chat: ChatDomainModel; members: ChatMemberDomainModel[] }> {
    const chat = await this.chatRepo.findById(chatId);
    if (!chat) {
      throw new MicroserviceException('Chat not found', status.NOT_FOUND);
    }

    const isMember = await this.memberRepo.isMember(chatId, requestingUserId);
    if (!isMember) {
      throw new MicroserviceException(
        'Access denied',
        status.PERMISSION_DENIED,
      );
    }

    const members = await this.memberRepo.findAllActive(chatId);
    return { chat, members };
  }

  async getChatsByUserId(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<
    { chat: ChatDomainModel; members: ChatMemberDomainModel[]; unreadCount: number }[]
  > {
    const chats = await this.chatRepo.findByUserId(userId, limit, offset);
    return Promise.all(
      chats.map(async (chat) => {
        const [members, unreadCount] = await Promise.all([
          this.memberRepo.findAllActive(chat.id),
          this.chatRepo.countUnread(chat.id, userId),
        ]);
        return { chat, members, unreadCount };
      }),
    );
  }

  async addMember(
    options: AddMemberOptions,
  ): Promise<{ member: ChatMemberDomainModel; chatKeyVersion: number }> {
    const chat = await this.chatRepo.findById(options.chatId);
    if (!chat) {
      throw new MicroserviceException('Chat not found', status.NOT_FOUND);
    }

    const requester = await this.memberRepo.findActive(
      options.chatId,
      options.requestingUserId,
    );
    if (
      !requester ||
      (requester.role !== 'OWNER' && requester.role !== 'ADMIN')
    ) {
      throw new MicroserviceException(
        'Insufficient permissions',
        status.PERMISSION_DENIED,
      );
    }

    const existing = await this.memberRepo.findActive(
      options.chatId,
      options.targetUserId,
    );
    if (existing) {
      throw new MicroserviceException(
        'User is already a member',
        status.ALREADY_EXISTS,
      );
    }

    const member = await this.memberRepo.add({
      chatId: options.chatId,
      userId: options.targetUserId,
      role: options.role,
      // canReadFrom controls which historical messages the new member may access.
      // null  → full history; the client must redistribute per-message AES keys
      //         via StoreMessageKeys for each accessible message.
      // <date> → history before this timestamp is gated server-side; no key
      //          redistribution needed for older messages.
      // keyVersion is NOT bumped: senders naturally include the new member in
      // future SendMessage.messageKeys. Bump only happens on removal.
      canReadFrom: options.canReadFrom,
    });

    this.logger.info(
      {
        chatId: options.chatId,
        targetUserId: options.targetUserId,
        role: options.role,
        addedBy: options.requestingUserId,
        chatKeyVersion: chat.keyVersion,
      },
      'Chat member added',
    );

    this.commMetrics.recordMembersAdded(1);

    // chatKeyVersion lets the caller know which epoch the member joined in so
    // they can drive StoreMessageKeys redistribution for the right range.
    return { member, chatKeyVersion: chat.keyVersion };
  }

  async removeMember(
    chatId: string,
    requestingUserId: string,
    targetUserId: string,
  ): Promise<void> {
    const requester = await this.memberRepo.findActive(
      chatId,
      requestingUserId,
    );
    const isSelfLeave = requestingUserId === targetUserId;

    if (
      !isSelfLeave &&
      (!requester || (requester.role !== 'OWNER' && requester.role !== 'ADMIN'))
    ) {
      throw new MicroserviceException(
        'Insufficient permissions',
        status.PERMISSION_DENIED,
      );
    }

    const removed = await this.memberRepo.remove(chatId, targetUserId);
    if (!removed) {
      throw new MicroserviceException('Member not found', status.NOT_FOUND);
    }

    // Bump key version so the removed user cannot decrypt messages in the new epoch.
    await this.chatRepo.incrementKeyVersion(chatId);

    this.logger.info(
      {
        chatId,
        targetUserId,
        removedBy: requestingUserId,
        selfLeave: isSelfLeave,
      },
      'Chat member removed',
    );

    this.commMetrics.recordMemberRemoved();
  }

  async updateMemberRole(
    options: UpdateMemberRoleOptions,
  ): Promise<ChatMemberDomainModel> {
    const requester = await this.memberRepo.findActive(
      options.chatId,
      options.requestingUserId,
    );

    if (!requester || requester.role !== 'OWNER') {
      throw new MicroserviceException(
        'Only the chat owner can change member roles',
        status.PERMISSION_DENIED,
      );
    }

    if (options.requestingUserId === options.targetUserId) {
      throw new MicroserviceException(
        'Cannot change your own role — use TransferOwnership to pass ownership',
        status.INVALID_ARGUMENT,
      );
    }

    const target = await this.memberRepo.findActive(
      options.chatId,
      options.targetUserId,
    );
    if (!target) {
      throw new MicroserviceException('Member not found', status.NOT_FOUND);
    }

    if (target.role === 'OWNER') {
      throw new MicroserviceException(
        'Cannot demote the owner — use TransferOwnership first',
        status.FAILED_PRECONDITION,
      );
    }

    const updated = await this.memberRepo.updateRole(
      options.chatId,
      options.targetUserId,
      options.newRole,
    );
    if (!updated) {
      throw new MicroserviceException('Failed to update role', status.INTERNAL);
    }

    this.logger.info(
      {
        chatId: options.chatId,
        targetUserId: options.targetUserId,
        oldRole: target.role,
        newRole: options.newRole,
        changedBy: options.requestingUserId,
      },
      'Chat member role updated',
    );

    return updated;
  }

  async deleteChat(chatId: string, requestingUserId: string): Promise<void> {
    const chat = await this.chatRepo.findById(chatId);
    if (!chat) {
      throw new MicroserviceException('Chat not found', status.NOT_FOUND);
    }

    const member = await this.memberRepo.findActive(chatId, requestingUserId);
    if (!member) {
      throw new MicroserviceException('Access denied', status.PERMISSION_DENIED);
    }

    if (chat.type !== 'DIRECT' && member.role !== 'OWNER') {
      throw new MicroserviceException(
        'Only the chat owner can delete a group chat',
        status.PERMISSION_DENIED,
      );
    }

    await this.chatRepo.deleteById(chatId);

    this.logger.info({ chatId, deletedBy: requestingUserId }, 'Chat deleted');
  }

  async transferOwnership(
    chatId: string,
    currentOwnerId: string,
    newOwnerId: string,
  ): Promise<void> {
    const currentOwner = await this.memberRepo.findActive(
      chatId,
      currentOwnerId,
    );
    if (!currentOwner || currentOwner.role !== 'OWNER') {
      throw new MicroserviceException(
        'Only the current owner can transfer ownership',
        status.PERMISSION_DENIED,
      );
    }

    if (currentOwnerId === newOwnerId) {
      throw new MicroserviceException(
        'New owner must be a different member',
        status.INVALID_ARGUMENT,
      );
    }

    const newOwner = await this.memberRepo.findActive(chatId, newOwnerId);
    if (!newOwner) {
      throw new MicroserviceException(
        'Target member not found',
        status.NOT_FOUND,
      );
    }

    // Demote current owner to ADMIN before promoting new owner to avoid a
    // transient state where the chat has no owner.
    await this.memberRepo.updateRole(chatId, currentOwnerId, 'ADMIN');
    await this.memberRepo.updateRole(chatId, newOwnerId, 'OWNER');

    this.logger.info(
      { chatId, previousOwnerId: currentOwnerId, newOwnerId },
      'Chat ownership transferred',
    );
  }
}
