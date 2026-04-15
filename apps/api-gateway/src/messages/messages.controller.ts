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
import { MessagesService } from './messages.service';
import { SessionGuard } from '../auth/guards/session.guard';
import {
  CurrentUser,
  CurrentUser as CurrentUserType,
} from '../auth/decorators/current-user.decorator';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { AddReactionDto } from './dto/add-reaction.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { SwaggerApiTags } from '../common/swagger/api-tags';

@ApiTags(SwaggerApiTags.MESSAGES)
@ApiBearerAuth()
@UseGuards(SessionGuard)
@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('/chats/:chatId/messages')
  @ApiOperation({
    summary: 'Send an E2EE encrypted message to a chat',
    description:
      'Client encrypts the plaintext with AES-256-GCM using the derived messageKey from the sender chain. ' +
      'The encrypted payload (ciphertext + IV + authTag + keyVersion + iteration) is stored opaquely on the server.',
  })
  sendMessage(
    @CurrentUser() user: CurrentUserType,
    @Param('chatId') chatId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(user.userId, chatId, dto);
  }

  @Get('/chats/:chatId/messages')
  @ApiOperation({
    summary: 'Fetch paginated messages for a chat (cursor-based)',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'beforeMessageId', required: false, type: String })
  getMessages(
    @CurrentUser() user: CurrentUserType,
    @Param('chatId') chatId: string,
    @Query('limit') limit?: number,
    @Query('beforeMessageId') beforeMessageId?: string,
  ) {
    return this.messagesService.getMessages(
      user.userId,
      chatId,
      limit,
      beforeMessageId,
    );
  }

  @Patch('/chats/:chatId/messages/:messageId')
  @ApiOperation({
    summary:
      'Edit an encrypted message (re-encrypt with same or new chain step)',
  })
  updateMessage(
    @CurrentUser() user: CurrentUserType,
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.messagesService.updateMessage(user.userId, chatId, messageId, dto);
  }

  @Delete('/chats/:chatId/messages/:messageId')
  @ApiOperation({ summary: 'Delete a message (soft delete)' })
  deleteMessage(
    @CurrentUser() user: CurrentUserType,
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.messagesService.deleteMessage(user.userId, chatId, messageId);
  }

  @Post('/chats/:chatId/read')
  @ApiOperation({ summary: 'Mark messages up to a given ID as read' })
  markAsRead(
    @CurrentUser() user: CurrentUserType,
    @Param('chatId') chatId: string,
    @Body() dto: MarkAsReadDto,
  ) {
    return this.messagesService.markAsRead(user.userId, chatId, dto);
  }

  @Post('/chats/:chatId/messages/:messageId/reactions')
  @ApiOperation({ summary: 'Add an emoji reaction to a message' })
  addReaction(
    @CurrentUser() user: CurrentUserType,
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
    @Body() dto: AddReactionDto,
  ) {
    return this.messagesService.addReaction(user.userId, chatId, messageId, dto);
  }

  @Delete('/chats/:chatId/messages/:messageId/reactions/:emoji')
  @ApiOperation({ summary: 'Remove an emoji reaction from a message' })
  removeReaction(
    @CurrentUser() user: CurrentUserType,
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string,
  ) {
    return this.messagesService.removeReaction(user.userId, chatId, messageId, emoji);
  }
}
