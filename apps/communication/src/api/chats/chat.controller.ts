import { Controller, UseGuards } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { MessagePattern } from "@nestjs/microservices";
import { AddUsersToChatDTO, ChatIdDTO, CommunicationMessagePattern, CreateChatDTO, PassChatOwnershipDTO, RemoveUserFromChatDTO, UpdateChatDTO, UserIdDTO } from "@gomin/common";
import { ChatPermissionsGuard } from "../../lib/security/guards/chat-permission.guard";
import { PermissionsMetadata } from "../../lib/security/decorators/permission.decorator";
import { ChatPermission } from "../../lib/permissions/chat-permissions";
import { ChatOwnershipGuard } from "../../lib/security/guards/chat-ownership.guard";

@Controller("chats")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @MessagePattern(CommunicationMessagePattern.CREATE_CHAT)
  createChat(data: CreateChatDTO) {
  return this.chatService.createChat(data);
  }

  @UseGuards(ChatPermissionsGuard)
  @PermissionsMetadata(ChatPermission.general.UPDATE_CHAT)
  @MessagePattern(CommunicationMessagePattern.UPDATE_CHAT)
  updateChat(data: UpdateChatDTO) {
  return this.chatService.updateChat(data);
  }

  @UseGuards(ChatPermissionsGuard)
  @PermissionsMetadata(ChatPermission.admin.DELETE_CHAT)
  @MessagePattern(CommunicationMessagePattern.DELETE_CHAT)
  deleteChat({ chatId }: ChatIdDTO) {
  return this.chatService.deleteChat(chatId);
  }

  @MessagePattern(CommunicationMessagePattern.FIND_CHAT_BY_ID)
  findChatById({ chatId }: ChatIdDTO) {
  return this.chatService.findChatById(chatId);
  }

  @MessagePattern(CommunicationMessagePattern.GET_USER_CHATS)
  getUserChats({ userId }: UserIdDTO) {
    return this.chatService.getUserChats(userId);
  }

  @UseGuards(ChatPermissionsGuard)
  @PermissionsMetadata(ChatPermission.general.ADD_USERS)
  @MessagePattern(CommunicationMessagePattern.ADD_USER_TO_CHAT)
  addUserToChat(data: AddUsersToChatDTO) {
    return this.chatService.addUsersToChat(data.chatId, data.users)
  }

  @UseGuards(ChatPermissionsGuard)
  @PermissionsMetadata(ChatPermission.admin.REMOVE_USER)
  @MessagePattern(CommunicationMessagePattern.REMOVE_USER_FROM_CHAT)
  removeUserFromChat(data: RemoveUserFromChatDTO) {
    return this.chatService.removeChatUser(data.chatId, data.userId);
  }

  @UseGuards(ChatOwnershipGuard)
  @MessagePattern(CommunicationMessagePattern.PASS_OWNERSHIP)
  passOwnership(data: PassChatOwnershipDTO) {
    return this.chatService.passOwnership(data.chatId, data.newOwnerId);
  }
}