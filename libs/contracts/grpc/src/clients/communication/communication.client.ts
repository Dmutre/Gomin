import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Metadata } from '@grpc/grpc-js';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { COMMUNICATION_CLIENT } from './communication.tokens';
import type {
  PingRequest,
  PingResponse,
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
  DeleteChatRequest,
  StatusResponse,
  SendMessageRequest,
  MessageResponse,
  GetMessagesRequest,
  MessagesResponse,
  UpdateMessageRequest,
  DeleteMessageRequest,
  MarkAsReadRequest,
  AddReactionRequest,
  ReactionResponse,
  RemoveReactionRequest,
  StoreSenderKeysRequest,
  GetSenderKeyRequest,
  SenderKeyResponse,
  GetChatSenderKeysRequest,
  ChatSenderKeysResponse,
} from '../../types/generated/communication';

export interface ICommunicationService {
  ping(data: PingRequest, metadata?: Metadata): Observable<PingResponse>;
  createChat(
    data: CreateChatRequest,
    metadata?: Metadata,
  ): Observable<ChatResponse>;
  getChat(data: GetChatRequest, metadata?: Metadata): Observable<ChatResponse>;
  getChatsByUserId(
    data: GetChatsByUserIdRequest,
    metadata?: Metadata,
  ): Observable<ChatsResponse>;
  addChatMember(
    data: AddChatMemberRequest,
    metadata?: Metadata,
  ): Observable<ChatMemberResponse>;
  removeChatMember(
    data: RemoveChatMemberRequest,
    metadata?: Metadata,
  ): Observable<StatusResponse>;
  updateMemberRole(
    data: UpdateMemberRoleRequest,
    metadata?: Metadata,
  ): Observable<ChatMemberResponse>;
  transferOwnership(
    data: TransferOwnershipRequest,
    metadata?: Metadata,
  ): Observable<StatusResponse>;
  deleteChat(
    data: DeleteChatRequest,
    metadata?: Metadata,
  ): Observable<StatusResponse>;
  sendMessage(
    data: SendMessageRequest,
    metadata?: Metadata,
  ): Observable<MessageResponse>;
  getMessages(
    data: GetMessagesRequest,
    metadata?: Metadata,
  ): Observable<MessagesResponse>;
  updateMessage(
    data: UpdateMessageRequest,
    metadata?: Metadata,
  ): Observable<MessageResponse>;
  deleteMessage(
    data: DeleteMessageRequest,
    metadata?: Metadata,
  ): Observable<StatusResponse>;
  markAsRead(
    data: MarkAsReadRequest,
    metadata?: Metadata,
  ): Observable<StatusResponse>;
  addReaction(
    data: AddReactionRequest,
    metadata?: Metadata,
  ): Observable<ReactionResponse>;
  removeReaction(
    data: RemoveReactionRequest,
    metadata?: Metadata,
  ): Observable<StatusResponse>;
  storeSenderKeys(
    data: StoreSenderKeysRequest,
    metadata?: Metadata,
  ): Observable<StatusResponse>;
  getSenderKey(
    data: GetSenderKeyRequest,
    metadata?: Metadata,
  ): Observable<SenderKeyResponse>;
  getChatSenderKeys(
    data: GetChatSenderKeysRequest,
    metadata?: Metadata,
  ): Observable<ChatSenderKeysResponse>;
}

@Injectable()
export class CommunicationGrpcClient implements OnModuleInit {
  private service!: ICommunicationService;

  constructor(
    @Inject(COMMUNICATION_CLIENT) private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.service = this.client.getService<ICommunicationService>(
      'CommunicationService',
    );
  }

  ping(data: PingRequest, metadata?: Metadata): Promise<PingResponse> {
    return firstValueFrom(this.service.ping(data, metadata));
  }

  createChat(
    data: CreateChatRequest,
    metadata?: Metadata,
  ): Promise<ChatResponse> {
    return firstValueFrom(this.service.createChat(data, metadata));
  }

  getChat(data: GetChatRequest, metadata?: Metadata): Promise<ChatResponse> {
    return firstValueFrom(this.service.getChat(data, metadata));
  }

  getChatsByUserId(
    data: GetChatsByUserIdRequest,
    metadata?: Metadata,
  ): Promise<ChatsResponse> {
    return firstValueFrom(this.service.getChatsByUserId(data, metadata));
  }

  addChatMember(
    data: AddChatMemberRequest,
    metadata?: Metadata,
  ): Promise<ChatMemberResponse> {
    return firstValueFrom(this.service.addChatMember(data, metadata));
  }

  removeChatMember(
    data: RemoveChatMemberRequest,
    metadata?: Metadata,
  ): Promise<StatusResponse> {
    return firstValueFrom(this.service.removeChatMember(data, metadata));
  }

  updateMemberRole(
    data: UpdateMemberRoleRequest,
    metadata?: Metadata,
  ): Promise<ChatMemberResponse> {
    return firstValueFrom(this.service.updateMemberRole(data, metadata));
  }

  transferOwnership(
    data: TransferOwnershipRequest,
    metadata?: Metadata,
  ): Promise<StatusResponse> {
    return firstValueFrom(this.service.transferOwnership(data, metadata));
  }

  deleteChat(
    data: DeleteChatRequest,
    metadata?: Metadata,
  ): Promise<StatusResponse> {
    return firstValueFrom(this.service.deleteChat(data, metadata));
  }

  sendMessage(
    data: SendMessageRequest,
    metadata?: Metadata,
  ): Promise<MessageResponse> {
    return firstValueFrom(this.service.sendMessage(data, metadata));
  }

  getMessages(
    data: GetMessagesRequest,
    metadata?: Metadata,
  ): Promise<MessagesResponse> {
    return firstValueFrom(this.service.getMessages(data, metadata));
  }

  updateMessage(
    data: UpdateMessageRequest,
    metadata?: Metadata,
  ): Promise<MessageResponse> {
    return firstValueFrom(this.service.updateMessage(data, metadata));
  }

  deleteMessage(
    data: DeleteMessageRequest,
    metadata?: Metadata,
  ): Promise<StatusResponse> {
    return firstValueFrom(this.service.deleteMessage(data, metadata));
  }

  markAsRead(
    data: MarkAsReadRequest,
    metadata?: Metadata,
  ): Promise<StatusResponse> {
    return firstValueFrom(this.service.markAsRead(data, metadata));
  }

  addReaction(
    data: AddReactionRequest,
    metadata?: Metadata,
  ): Promise<ReactionResponse> {
    return firstValueFrom(this.service.addReaction(data, metadata));
  }

  removeReaction(
    data: RemoveReactionRequest,
    metadata?: Metadata,
  ): Promise<StatusResponse> {
    return firstValueFrom(this.service.removeReaction(data, metadata));
  }

  storeSenderKeys(
    data: StoreSenderKeysRequest,
    metadata?: Metadata,
  ): Promise<StatusResponse> {
    return firstValueFrom(this.service.storeSenderKeys(data, metadata));
  }

  getSenderKey(
    data: GetSenderKeyRequest,
    metadata?: Metadata,
  ): Promise<SenderKeyResponse> {
    return firstValueFrom(this.service.getSenderKey(data, metadata));
  }

  getChatSenderKeys(
    data: GetChatSenderKeysRequest,
    metadata?: Metadata,
  ): Promise<ChatSenderKeysResponse> {
    return firstValueFrom(this.service.getChatSenderKeys(data, metadata));
  }
}
