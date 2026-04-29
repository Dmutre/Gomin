import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { SessionGuard } from '../auth/guards/session.guard';
import {
  CurrentUser,
  CurrentUser as CurrentUserType,
} from '../auth/decorators/current-user.decorator';
import { CreateChatDto } from './dto/create-chat.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-role.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';
import { SwaggerApiTags } from '../common/swagger/api-tags';

@ApiTags(SwaggerApiTags.CHATS)
@ApiBearerAuth()
@UseGuards(SessionGuard)
@Controller('/chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post('/')
  @ApiOperation({ summary: 'Create a new chat (direct, group, or channel)' })
  createChat(@CurrentUser() user: CurrentUserType, @Body() dto: CreateChatDto) {
    return this.chatsService.createChat(user.userId, dto);
  }

  @Get('/')
  @ApiOperation({ summary: "List the current user's chats" })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  getChats(
    @CurrentUser() user: CurrentUserType,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.chatsService.getChats(user.userId, limit, offset);
  }

  @Get('/:chatId')
  @ApiOperation({ summary: 'Get a single chat with its members' })
  getChat(
    @CurrentUser() user: CurrentUserType,
    @Param('chatId') chatId: string,
  ) {
    return this.chatsService.getChat(user.userId, chatId);
  }

  @Post('/:chatId/members')
  @ApiOperation({ summary: 'Add a member to a group/channel chat' })
  addMember(
    @CurrentUser() user: CurrentUserType,
    @Param('chatId') chatId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.chatsService.addMember(user.userId, chatId, dto);
  }

  @Delete('/:chatId/members/:targetUserId')
  @ApiOperation({ summary: 'Remove a member from a group/channel chat' })
  removeMember(
    @CurrentUser() user: CurrentUserType,
    @Param('chatId') chatId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.chatsService.removeMember(user.userId, chatId, targetUserId);
  }

  @Patch('/:chatId/members/:targetUserId/role')
  @ApiOperation({ summary: 'Update a member role (ADMIN or MEMBER)' })
  updateMemberRole(
    @CurrentUser() user: CurrentUserType,
    @Param('chatId') chatId: string,
    @Param('targetUserId') targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.chatsService.updateMemberRole(
      user.userId,
      chatId,
      targetUserId,
      dto,
    );
  }

  @Post('/:chatId/transfer-ownership')
  @ApiOperation({ summary: 'Transfer chat ownership to another member' })
  transferOwnership(
    @CurrentUser() user: CurrentUserType,
    @Param('chatId') chatId: string,
    @Body() dto: TransferOwnershipDto,
  ) {
    return this.chatsService.transferOwnership(user.userId, chatId, dto);
  }

  @Delete('/:chatId')
  @ApiOperation({ summary: 'Delete a chat and all its messages and keys' })
  deleteChat(
    @CurrentUser() user: CurrentUserType,
    @Param('chatId') chatId: string,
  ) {
    return this.chatsService.deleteChat(user.userId, chatId);
  }
}
