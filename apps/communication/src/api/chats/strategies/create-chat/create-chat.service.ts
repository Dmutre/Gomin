import { HttpStatus, Injectable } from "@nestjs/common";
import { CreateChatStrategy } from "../../../../lib/interfaces/create-chat.strategy";
import { CreateChannelStrategy } from "./create-channel-chat.strategy";
import { CreatePrivateChatStrategy } from "./create-private-chat.strategy";
import { PermissionClient } from "@gomin/utils";
import { ChatRepository } from "../../../../lib/database/repositories/chat.repository";
import { CreateChatDTO, MicroserviceException } from "@gomin/common";
import { ChatType } from "@my-prisma/client/communication";
import { UserChatRepository } from "../../../../lib/database/repositories/user-chat.repository";
import { CreateGroupStrategy } from "./create-group-chat.strategy";
import { ChatFull } from "@gomin/communication-db";

@Injectable()
export class CreateChatService {

  constructor(
    private readonly createChannelStrategy: CreateChannelStrategy,
    private readonly createGroupStrategy: CreateGroupStrategy,
    private readonly createPrivateStrategy: CreatePrivateChatStrategy,
    private readonly permissionClient: PermissionClient,
    private readonly chatRepo: ChatRepository,
    private readonly userChatRepo: UserChatRepository,
  ) {}

  async createChat(chatDto: CreateChatDTO): Promise<ChatFull> {
    const strategy = this.getStrategy(chatDto.type);
    const { chatData, userChatsData, permissions } = await strategy.create(chatDto)

    const chat = await this.chatRepo.createChat(chatData)
    await this.userChatRepo.createManyUserChat(userChatsData)
  
    if (permissions?.length) {
      await this.permissionClient.createManyUserPermissions(permissions)
    }

    return chat;
  }

  private getStrategy(type: ChatType): CreateChatStrategy {
    switch (type) {
      case ChatType.PRIVATE:
        return this.createPrivateStrategy
      case ChatType.GROUP:
        return this.createGroupStrategy
      case ChatType.CHANNEL:
        return this.createChannelStrategy
      default:
        throw new MicroserviceException(`Unsupported chat type: ${type}`, HttpStatus.BAD_REQUEST)
    }
  }
}
