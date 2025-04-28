import { Controller, UseGuards } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { CommunicationMessagePattern, MessageActionDTO, ReadMessagesDTO, SendMessageDTO, UpdateMessageDTO } from "@gomin/common";
import { ExecutorBelongsToChatGuard } from "../../lib/security/guards/executor-belongs-to-chat.guard";
import { PermissionsMetadata } from "../../lib/security/decorators/permission.decorator";
import { ChatPermission } from "../../lib/permissions/chat-permissions";
import { MessageService } from "./message.service";
import { ChatPermissionsGuard } from "../../lib/security/guards/chat-permission.guard";
import { ExecutorOwnMessageGuard } from "../../lib/security/guards/executor-own-message.guard";

@Controller('messages')
export class MessageController {

  constructor(private readonly messageService: MessageService) {}

  @UseGuards(ExecutorBelongsToChatGuard, ChatPermissionsGuard)
  @PermissionsMetadata(ChatPermission.general.SEND_MESSAGES)
  @MessagePattern(CommunicationMessagePattern.SEND_MESSAGE)
  sendMessage(data: SendMessageDTO) {
    return this.messageService.sendMessage(data);
  }

  @UseGuards(ExecutorOwnMessageGuard, ExecutorBelongsToChatGuard)
  @MessagePattern(CommunicationMessagePattern.UPDATE_MESSAGE)
  updateMessage(data: UpdateMessageDTO) {
    return this.messageService.updateMessage(data);
  }

  @UseGuards(ExecutorBelongsToChatGuard, ExecutorOwnMessageGuard, ChatPermissionsGuard)
  @PermissionsMetadata(ChatPermission.general.DELETE_MESSAGES)
  @MessagePattern(CommunicationMessagePattern.DELETE_MESSAGE)
  deleteMessage(data: MessageActionDTO) {
    return this.messageService.deleteMessage(data.messageId);
  }

  @UseGuards(ChatPermissionsGuard)
  @PermissionsMetadata(ChatPermission.admin.DELETE_USER_MESSAGES)
  @MessagePattern(CommunicationMessagePattern.DELETE_OTHER_MESSAGES)
  deleteUserMessage(data: MessageActionDTO) {
    return this.messageService.deleteMessage(data.messageId);
  }

  @UseGuards(ExecutorBelongsToChatGuard)
  @MessagePattern(CommunicationMessagePattern.READ_MESSAGES)
  readMessages(data: ReadMessagesDTO) {
    return this.messageService.readMessages(data);
  }
}