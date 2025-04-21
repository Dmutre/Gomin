import { CreateChatDTO, CreateUserPermissionDTO } from "@gomin/common";
import { Prisma } from '@my-prisma/client/communication';

export interface CreateChatStrategy {
  create(chatDto: CreateChatDTO): Promise<{ chatData: Prisma.ChatCreateInput, userChatsData: Prisma.UserChatCreateManyInput[], permissions: CreateUserPermissionDTO[] }>
}
