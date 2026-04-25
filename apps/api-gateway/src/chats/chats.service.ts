import { Injectable } from '@nestjs/common';
import { Metadata } from '@grpc/grpc-js';
import { status } from '@grpc/grpc-js';
import { MicroserviceException } from '@gomin/app';
import { MicroserviceIdentityAuthService } from '@gomin/service-identity';
import { CommunicationGrpcClient, UserAuthGrpcClient, ChatType, ChatMemberRole } from '@gomin/grpc';
import { RedisPubSubService } from '../websocket/redis-pubsub.service';
import { ChatTypeDto } from './dto/create-chat.dto';
import { MemberRoleDto } from './dto/add-member.dto';
import type { CreateChatDto } from './dto/create-chat.dto';
import type { AddMemberDto } from './dto/add-member.dto';
import type { UpdateMemberRoleDto } from './dto/update-role.dto';
import type { TransferOwnershipDto } from './dto/transfer-ownership.dto';

const CHAT_TYPE_MAP: Record<ChatTypeDto, ChatType> = {
  [ChatTypeDto.DIRECT]: ChatType.CHAT_TYPE_DIRECT,
  [ChatTypeDto.GROUP]: ChatType.CHAT_TYPE_GROUP,
  [ChatTypeDto.CHANNEL]: ChatType.CHAT_TYPE_CHANNEL,
};

const MEMBER_ROLE_MAP: Record<MemberRoleDto, ChatMemberRole> = {
  [MemberRoleDto.OWNER]: ChatMemberRole.CHAT_MEMBER_ROLE_OWNER,
  [MemberRoleDto.ADMIN]: ChatMemberRole.CHAT_MEMBER_ROLE_ADMIN,
  [MemberRoleDto.MEMBER]: ChatMemberRole.CHAT_MEMBER_ROLE_MEMBER,
};

@Injectable()
export class ChatsService {
  constructor(
    private readonly communicationClient: CommunicationGrpcClient,
    private readonly userAuthClient: UserAuthGrpcClient,
    private readonly identityAuthService: MicroserviceIdentityAuthService,
    private readonly pubSub: RedisPubSubService,
  ) {}

  private async buildMetadata(): Promise<Metadata> {
    const token = await this.identityAuthService.getAccessToken();
    const metadata = new Metadata();
    if (token) metadata.add('authorization', `Bearer ${token}`);
    return metadata;
  }

  async createChat(userId: string, dto: CreateChatDto) {
    const metadata = await this.buildMetadata();

    const { users } = await this.userAuthClient.resolveUsersByUsernames(
      { usernames: dto.memberUsernames },
      metadata,
    );

    if (users.length !== dto.memberUsernames.length) {
      const found = new Set(users.map((u) => u.username));
      const missing = dto.memberUsernames.filter((u) => !found.has(u));
      throw new MicroserviceException(
        `Users not found: ${missing.join(', ')}`,
        status.NOT_FOUND,
      );
    }

    const result = await this.communicationClient.createChat(
      {
        type: CHAT_TYPE_MAP[dto.type],
        name: dto.name ?? '',
        creatorUserId: userId,
        memberUserIds: users.map((u) => u.userId),
      },
      metadata,
    );

    if (result.chat?.members) {
      await Promise.all(
        result.chat.members.map((member) =>
          this.pubSub.publish(this.pubSub.userChannel(member.userId), {
            event: 'chat:new',
            data: result,
          }),
        ),
      );
    }

    return result;
  }

  async getChat(userId: string, chatId: string) {
    const metadata = await this.buildMetadata();
    return this.communicationClient.getChat({ chatId, userId }, metadata);
  }

  async getChats(userId: string, limit = 20, offset = 0) {
    const metadata = await this.buildMetadata();
    return this.communicationClient.getChatsByUserId(
      { userId, limit, offset },
      metadata,
    );
  }

  async addMember(requestingUserId: string, chatId: string, dto: AddMemberDto) {
    const metadata = await this.buildMetadata();
    const result = await this.communicationClient.addChatMember(
      {
        chatId,
        requestingUserId,
        targetUserId: dto.userId,
        role: MEMBER_ROLE_MAP[dto.role],
        canReadFrom: dto.canReadFrom ? new Date(dto.canReadFrom) : undefined,
      },
      metadata,
    );

    await this.pubSub.publish(this.pubSub.chatChannel(chatId), {
      event: 'chat:member_added',
      chatId,
      data: { chatId, userId: dto.userId, addedBy: requestingUserId },
    });

    return result;
  }

  async removeMember(
    requestingUserId: string,
    chatId: string,
    targetUserId: string,
  ) {
    const metadata = await this.buildMetadata();
    const result = await this.communicationClient.removeChatMember(
      { chatId, requestingUserId, targetUserId },
      metadata,
    );

    await this.pubSub.publish(this.pubSub.chatChannel(chatId), {
      event: 'chat:member_removed',
      chatId,
      data: { chatId, userId: targetUserId, removedBy: requestingUserId },
    });

    return result;
  }

  async updateMemberRole(
    requestingUserId: string,
    chatId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const metadata = await this.buildMetadata();
    return this.communicationClient.updateMemberRole(
      {
        chatId,
        requestingUserId,
        targetUserId,
        newRole: MEMBER_ROLE_MAP[dto.newRole],
      },
      metadata,
    );
  }

  async transferOwnership(
    currentOwnerId: string,
    chatId: string,
    dto: TransferOwnershipDto,
  ) {
    const metadata = await this.buildMetadata();
    return this.communicationClient.transferOwnership(
      { chatId, currentOwnerId, newOwnerId: dto.newOwnerId },
      metadata,
    );
  }
}
