import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { MicroserviceException } from '@gomin/app';
import {
  MicroserviceIdentityGuard,
  Permission,
  RequirePermission,
} from '@gomin/service-identity';
import { ChatService } from './chat.service';
import { ChatGrpcMapper } from './chat.grpc.mapper';
import type {
  CreateChatRequest,
  ChatResponse,
  GetChatRequest,
  GetChatsByUserIdRequest,
  ChatsResponse,
  AddChatMemberRequest,
  ChatMemberResponse,
  RemoveChatMemberRequest,
  UpdateMemberRoleRequest,
  TransferOwnershipRequest,
  StatusResponse,
} from '@gomin/grpc';

@Controller()
@UseGuards(MicroserviceIdentityGuard)
export class ChatGrpcController {
  constructor(private readonly chatService: ChatService) {}

  @GrpcMethod('CommunicationService', 'CreateChat')
  @RequirePermission(Permission.COMMUNICATION_CHATS_WRITE)
  async createChat(data: CreateChatRequest): Promise<ChatResponse> {
    const { chat, members } = await this.chatService.createChat({
      type: ChatGrpcMapper.chatTypeFromProto(data.type),
      name: data.name || null,
      creatorUserId: data.creatorUserId,
      memberUserIds: data.memberUserIds,
    });
    return { chat: ChatGrpcMapper.chatToProto(chat, members) };
  }

  @GrpcMethod('CommunicationService', 'GetChat')
  @RequirePermission(Permission.COMMUNICATION_CHATS_READ)
  async getChat(data: GetChatRequest): Promise<ChatResponse> {
    const { chat, members } = await this.chatService.getChat(
      data.chatId,
      data.userId,
    );
    return { chat: ChatGrpcMapper.chatToProto(chat, members) };
  }

  @GrpcMethod('CommunicationService', 'GetChatsByUserId')
  @RequirePermission(Permission.COMMUNICATION_CHATS_READ)
  async getChatsByUserId(
    data: GetChatsByUserIdRequest,
  ): Promise<ChatsResponse> {
    const limit = data.limit > 0 ? data.limit : 20;
    const results = await this.chatService.getChatsByUserId(
      data.userId,
      limit,
      data.offset,
    );
    return {
      chats: results.map(({ chat, members }) =>
        ChatGrpcMapper.chatToProto(chat, members),
      ),
    };
  }

  @GrpcMethod('CommunicationService', 'AddChatMember')
  @RequirePermission(Permission.COMMUNICATION_CHATS_WRITE)
  async addChatMember(data: AddChatMemberRequest): Promise<ChatMemberResponse> {
    const { member, chatKeyVersion } = await this.chatService.addMember({
      chatId: data.chatId,
      requestingUserId: data.requestingUserId,
      targetUserId: data.targetUserId,
      role: ChatGrpcMapper.memberRoleFromProto(data.role),
      canReadFrom: data.canReadFrom ?? null,
    });
    return { member: ChatGrpcMapper.memberToProto(member), chatKeyVersion };
  }

  @GrpcMethod('CommunicationService', 'RemoveChatMember')
  @RequirePermission(Permission.COMMUNICATION_CHATS_WRITE)
  async removeChatMember(
    data: RemoveChatMemberRequest,
  ): Promise<StatusResponse> {
    await this.chatService.removeMember(
      data.chatId,
      data.requestingUserId,
      data.targetUserId,
    );
    return { success: true };
  }

  @GrpcMethod('CommunicationService', 'UpdateMemberRole')
  @RequirePermission(Permission.COMMUNICATION_CHATS_WRITE)
  async updateMemberRole(
    data: UpdateMemberRoleRequest,
  ): Promise<ChatMemberResponse> {
    const role = ChatGrpcMapper.memberRoleFromProto(data.newRole);
    if (role === 'OWNER') {
      throw new MicroserviceException(
        'Cannot assign OWNER via UpdateMemberRole — use TransferOwnership',
        status.INVALID_ARGUMENT,
      );
    }
    const updated = await this.chatService.updateMemberRole({
      chatId: data.chatId,
      requestingUserId: data.requestingUserId,
      targetUserId: data.targetUserId,
      newRole: role,
    });
    return { member: ChatGrpcMapper.memberToProto(updated), chatKeyVersion: 0 };
  }

  @GrpcMethod('CommunicationService', 'TransferOwnership')
  @RequirePermission(Permission.COMMUNICATION_CHATS_WRITE)
  async transferOwnership(
    data: TransferOwnershipRequest,
  ): Promise<StatusResponse> {
    await this.chatService.transferOwnership(
      data.chatId,
      data.currentOwnerId,
      data.newOwnerId,
    );
    return { success: true };
  }
}
