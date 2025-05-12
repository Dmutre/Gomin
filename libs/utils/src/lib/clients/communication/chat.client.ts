import { Inject, Injectable } from "@nestjs/common";
import { ChatExecutorDTO, COMMUNICATION_SERVICE } from "@gomin/common";
import { Observable } from 'rxjs'
import { Chat } from '@my-prisma/client/communication'
import { ClientProxy } from "@nestjs/microservices";
import {
  AddUsersToChatDTO,
  ChatIdDTO,
  CommunicationMessagePattern,
  CreateChatDTO,
  CreateManyUserPermissions,
  PassChatOwnershipDTO,
  RemoveUserFromChatDTO,
  UpdateChatDTO,
  UserIdDTO,
} from '@gomin/common'

@Injectable()
export class ChatClient {
  constructor(@Inject(COMMUNICATION_SERVICE) private readonly client: ClientProxy) {}

  createChat(data: CreateChatDTO): Observable<Chat> {
    return this.client.send(CommunicationMessagePattern.CREATE_CHAT, data)
  }

  updateChat(data: UpdateChatDTO): Observable<Chat> {
    return this.client.send(CommunicationMessagePattern.UPDATE_CHAT, data)
  }

  deleteChat(data: ChatExecutorDTO): Observable<{ message: string }> {
    return this.client.send(CommunicationMessagePattern.DELETE_CHAT, data)
  }

  findChatById(data: ChatIdDTO): Observable<Chat> {
    return this.client.send(CommunicationMessagePattern.FIND_CHAT_BY_ID, data)
  }

  getUserChats(data: UserIdDTO): Observable<Chat[]> {
    return this.client.send(CommunicationMessagePattern.GET_USER_CHATS, data)
  }

  addUserToChat(data: AddUsersToChatDTO): Observable<{ message: string }> {
    return this.client.send(CommunicationMessagePattern.ADD_USER_TO_CHAT, data)
  }

  removeUserFromChat(data: RemoveUserFromChatDTO): Observable<{ message: string }> {
    return this.client.send(CommunicationMessagePattern.REMOVE_USER_FROM_CHAT, data)
  }

  passOwnership(data: PassChatOwnershipDTO): Observable<{ message: string }> {
    return this.client.send(CommunicationMessagePattern.PASS_OWNERSHIP, data)
  }

  updateUserChatPermissions(data: CreateManyUserPermissions): Observable<{ message: string }> {
    return this.client.send(CommunicationMessagePattern.UPDATE_USER_CHAT_PERMISSIONS, data)
  }
}
