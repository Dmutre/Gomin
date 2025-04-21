import { Injectable } from "@nestjs/common";
import { CommunicationDatabaseService } from '@gomin/communication-db'
import { Prisma, UserChat, UserChatRole } from '@my-prisma/client/communication'
import { MessageDTO } from "@gomin/common";

@Injectable()
export class UserChatRepository {
  constructor(private readonly prisma: CommunicationDatabaseService) {}

  async createUserChat(data: Prisma.UserChatCreateInput): Promise<UserChat> {
    return await this.prisma.userChat.create({ data });
  }

  async createManyUserChat(data: Prisma.UserChatCreateManyInput[]): Promise<MessageDTO> {
    await this.prisma.userChat.createMany({ data });
    return { message: 'UserChat created successfully' };
  }

  async addMembers(chatId: string, members: { userId: string; role?: UserChatRole }[]): Promise<void> {
    await this.prisma.userChat.createMany({
      data: members.map(({ userId, role }) => ({
        userId,
        chatId,
        role: role ?? 'MEMBER',
      })),
      skipDuplicates: true,
    })
  }

  async removeUser(chatId: string, userId: string): Promise<void> {
    await this.prisma.userChat.delete({
      where: {
        userId_chatId: {
          chatId,
          userId,
        }
      }
    })
  }

  async updateChatUser(where: Prisma.UserChatWhereUniqueInput, data: Prisma.UserChatUncheckedUpdateInput) {
    await this.prisma.userChat.update({ where, data })
  }
}