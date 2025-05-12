import { Injectable } from "@nestjs/common";
import { ChatClient } from "@gomin/utils";
import { AddUsersToChatDTO, ChatExecutorDTO, CreateChatDTO, CreateManyUserPermissions, PassChatOwnershipDTO, RemoveUserFromChatDTO, UpdateChatDTO } from "@gomin/common";

@Injectable()
export class ChatService {

  constructor(private readonly chatClient: ChatClient) {}

  createChat(data: CreateChatDTO) {
    return this.chatClient.createChat(data);
  }

  updateChat(data: UpdateChatDTO) {
    return this.chatClient.updateChat(data);
  }

  deleteChat(data: ChatExecutorDTO) {
    return this.chatClient.deleteChat(data);
  }

  getChatById(chatId: string) {
    return this.chatClient.findChatById({ chatId });
  }

  getuserChats(userId: string) {
    return this.chatClient.getUserChats({ userId });
  }

  addUserToChat(data: AddUsersToChatDTO) {
    return this.chatClient.addUserToChat(data);
  }

  removeUserFromChat(data: RemoveUserFromChatDTO) {
    return this.chatClient.removeUserFromChat(data);
  }

  passOwnership(data: PassChatOwnershipDTO) {
    return this.chatClient.passOwnership(data);
  }

  updateUserChatPermissions(data: CreateManyUserPermissions) {
    return this.chatClient.updateUserChatPermissions(data);
  }
}