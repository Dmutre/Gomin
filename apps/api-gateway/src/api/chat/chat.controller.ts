import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ChatService } from "./chat.service";
import { AddUsersToChatDTO, ChatResponse, CreateManyUserPermissions, CreateUserChatDTO, MessageResponse, PassChatOwnershipDTO, RemoveUserFromChatDTO, UpdateUserChatDTO, UserResponse } from "@gomin/common";
import { ClsService } from "nestjs-cls";

@ApiTags('chat')
@Controller('/chat')
export class ChatController {
  
  constructor(
    private readonly chatService: ChatService,
    private readonly cls: ClsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create chat endpoint' })
  @ApiOkResponse({ type: ChatResponse })
  createChat(@Body() data: CreateUserChatDTO) {
    const user = this.cls.get<UserResponse>('user');
    return this.chatService.createChat({ ...data, ownerId: user.id })
  }

  @Patch()
  @ApiOperation({ summary: 'Update chat' })
  @ApiOkResponse({ type: ChatResponse })
  updateChat(@Param('chatId') chatId: string, @Body() data: UpdateUserChatDTO) {
    const user = this.cls.get<UserResponse>('user');
    return this.chatService.updateChat({ ...data, executorId: user.id })
  }

  @Delete('/:chatId')
  @ApiOperation({ summary: 'Delete chat' })
  @ApiOkResponse({ type: MessageResponse })
  deleteChat(@Param('chatId') chatId: string) {
    const user = this.cls.get<UserResponse>('user');
    return this.chatService.deleteChat({ chatId, executorId: user.id })
  }

  @Get('/:chatId')
  @ApiOperation({ summary: 'Get chat by id' })
  @ApiOkResponse({ type: ChatResponse })
  getChatById(@Param('chatId') chatId: string) {
    return this.chatService.getChatById(chatId);
  }

  @Get()
  @ApiOperation({ summary: 'Get user\'s chat '})
  @ApiOkResponse({ type: [ChatResponse] })
  getUserChats() {
    const user = this.cls.get<UserResponse>('user');
    return this.chatService.getuserChats(user.id);
  }

  @Post('/users/add')
  @ApiOperation({ summary: 'Add user to chat' })
  @ApiOkResponse({ type: ChatResponse })
  addUsersToChat(@Body() data: AddUsersToChatDTO) {
    const user = this.cls.get<UserResponse>('user');
    return this.chatService.addUserToChat({ ...data, executorId: user.id });
  }

  @Post('/users/remove')
  @ApiOperation({ summary: 'Remove user from chat' })
  @ApiOkResponse({ type: MessageResponse })
  removeUserFromChat(@Body() data: RemoveUserFromChatDTO) {
    const user = this.cls.get<UserResponse>('user');
    return this.chatService.removeUserFromChat({ ...data, executorId: user.id });
  }

  @Post('/pass-ownership')
  @ApiOperation({ summary: 'Pass chat ownership' })
  @ApiOkResponse({ type: MessageResponse })
  passOwnership(@Body() data: PassChatOwnershipDTO) {
    const user = this.cls.get<UserResponse>('user');
    return this.chatService.passOwnership({ ...data, executorId: user.id })
  }

  @Patch('/permissions')
  @ApiOperation({ summary: 'Update user chat permissions' })
  @ApiOkResponse({ type: MessageResponse })
  updateUserChatPermissions(@Body() data: CreateManyUserPermissions) {
    const user = this.cls.get<UserResponse>('user');
    return this.chatService.updateUserChatPermissions({ ...data, executorId: user.id });
  }
}