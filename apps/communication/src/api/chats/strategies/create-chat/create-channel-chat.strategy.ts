import { randomUUID } from "crypto";
import { CreateChatStrategy } from "../../../../lib/interfaces/create-chat.strategy";
import { CreateChatDTO, CreateUserPermissionDTO } from "@gomin/common";
import { Prisma } from "@my-prisma/client/communication";
import { ChatPermission } from "../../../../lib/permissions/chat-permissions";

export class CreateChannelStrategy implements CreateChatStrategy {
  async create(chatDto: CreateChatDTO): Promise<{ chatData: Prisma.ChatCreateInput; userChatsData: Prisma.UserChatCreateManyInput[]; permissions: CreateUserPermissionDTO[] }> {
    const chatData: Prisma.ChatCreateInput = {
      id: randomUUID(),
      type: "CHANNEL",
      name: chatDto.name,
      description: chatDto.description,
      ownerId: chatDto.ownerId,
    };

    const userChatsData: Prisma.UserChatCreateManyInput[] = chatDto.members.map(userId => ({
      userId,
      role: userId === chatDto.ownerId ? "ADMIN" : "SUBSCRIBER",
      chatId: chatData.id,
    }));

    const permissions: CreateUserPermissionDTO[] = []

    for (const userId of chatDto.members) {
      const isOwner = userId === chatDto.ownerId

      const permissionCodes = [
        ...(isOwner ? [...Object.values(ChatPermission.admin), ...Object.values(ChatPermission.channel)] : [])
      ]

      permissions.push(
        ...permissionCodes.map(code => ({
          userId,
          entityType: 'GROUP' as const,
          entityId: chatData.id,
          code,
          allowed: true,
        }))
      )
    }

    return Promise.resolve({ chatData, userChatsData, permissions });
  }
}