import { HttpStatus, Injectable } from "@nestjs/common";
import { ChatRepository } from "../../lib/database/repositories/chat.repository";
import { CreateChatDTO, MicroserviceException, UpdateChatDTO } from "@gomin/common";
import { CreateChatService } from "./strategies/create-chat/create-chat.service";
import { ChatFull } from "@gomin/communication-db";
import { Chat, UserChatRole } from "@my-prisma/client/communication";
import { UserChatRepository } from "../../lib/database/repositories/user-chat.repository";

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly createChatServie: CreateChatService,
    private readonly userChatRepo: UserChatRepository,
  ) {}

  async createChat(data: CreateChatDTO): Promise<ChatFull> {
    return await this.createChatServie.createChat(data);
  }

  async updateChat(id: string, data: UpdateChatDTO): Promise<ChatFull> {
    return await this.chatRepo.updateChat(id, data);
  }

  async deleteChat(id: string) {
    return await this.chatRepo.deleteChat(id);
  }

  async findChatById(id: string): Promise<ChatFull> {
    return await this.chatRepo.findOrThrow(id);
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    return await this.chatRepo.getUserChats(userId);
  }

  async addUsersToChat(chatId: string, users: string[]): Promise<ChatFull> {
    const chat = await this.findChatById(chatId);
    const newMembersRole: UserChatRole = chat.type === 'CHANNEL' ? 'SUBSCRIBER' : 'MEMBER';
    await this.userChatRepo.addMembers(chatId, users.map((userId) => ({ userId, role: newMembersRole })));
    return this.findChatById(chatId)
  }

  async removeChatUser(chatId: string, userId: string) {
    await this.userChatRepo.removeUser(chatId, userId);
    return await this.findChatById(chatId);
  }

  async passOwnership(chatId: string, newOwnerId: string) {
    const chat = await this.chatRepo.findChatById(chatId);
    this.checkDoesUserExistInChat(newOwnerId, chat);
    if (chat.ownerId === newOwnerId) {
      throw new MicroserviceException('This user is already an owner', HttpStatus.BAD_REQUEST);
    }
    await Promise.all([
      this.chatRepo.updateChat(chatId, { ownerId: newOwnerId }),
      this.updateUserChatRole(chat.ownerId, chat.id, 'ADMIN'),
      this.updateUserChatRole(newOwnerId, chat.id, 'OWNER'),
    ]);
    return this.findChatById(chat.id);
  }

  private checkDoesUserExistInChat(userId: string, chat: ChatFull) {
    const isUserInChat = chat.members.find((member) => member.userId === userId);
    if(!isUserInChat)
      throw new MicroserviceException('Possible owner is not in this chat', HttpStatus.BAD_REQUEST);
  }

  private async updateUserChatRole(userId: string, chatId: string, role: UserChatRole) {
    await this.userChatRepo.updateChatUser({ userId_chatId: { userId, chatId }}, { role });
  }
}