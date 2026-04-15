import { Injectable } from '@nestjs/common';
import { Metadata } from '@grpc/grpc-js';
import { MicroserviceIdentityAuthService } from '@gomin/service-identity';
import { CommunicationGrpcClient } from '@gomin/grpc';
import { RedisPubSubService } from '../websocket/redis-pubsub.service';
import type { CreateChatDto } from './dto/create-chat.dto';
import type { AddMemberDto } from './dto/add-member.dto';
import type { UpdateMemberRoleDto } from './dto/update-role.dto';
import type { TransferOwnershipDto } from './dto/transfer-ownership.dto';

@Injectable()
export class ChatsService {
  constructor(
    private readonly communicationClient: CommunicationGrpcClient,
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
    return this.communicationClient.createChat(
      {
        type: dto.type,
        name: dto.name ?? '',
        creatorUserId: userId,
        memberUserIds: dto.memberUserIds,
      },
      metadata,
    );
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
        targetUserId: dto.targetUserId,
        role: dto.role,
        canReadFrom: dto.canReadFrom ? new Date(dto.canReadFrom) : undefined,
      },
      metadata,
    );

    await this.pubSub.publish(this.pubSub.chatChannel(chatId), {
      event: 'chat:member_added',
      chatId,
      data: { chatId, userId: dto.targetUserId, addedBy: requestingUserId },
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
        newRole: dto.newRole,
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
