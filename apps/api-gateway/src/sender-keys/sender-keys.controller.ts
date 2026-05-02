import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { SenderKeysService } from './sender-keys.service';
import { SessionGuard } from '../auth/guards/session.guard';
import {
  CurrentUser,
  CurrentUser as CurrentUserType,
} from '../auth/decorators/current-user.decorator';
import { StoreSenderKeysDto } from './dto/store-sender-keys.dto';
import { SwaggerApiTags } from '../common/swagger/api-tags';

@ApiTags(SwaggerApiTags.SENDER_KEYS)
@ApiBearerAuth()
@UseGuards(SessionGuard)
@Controller('/chats/:chatId/sender-keys')
export class SenderKeysController {
  constructor(private readonly senderKeysService: SenderKeysService) {}

  @Post('/')
  @ApiOperation({
    summary: 'Store (or rotate) sender chain keys',
    description:
      'Called after joining a chat or after a member is removed. ' +
      'Send one SenderKeyEntry per (sender, recipient) pair: the chain key encrypted ' +
      'with the recipient RSA-OAEP public key. Server upserts on (chatId, senderId, recipientId).',
  })
  storeSenderKeys(
    @Param('chatId', ParseUUIDPipe) chatId: string,
    @Body() dto: StoreSenderKeysDto,
  ) {
    return this.senderKeysService.storeSenderKeys(chatId, dto);
  }

  @Get('/')
  @ApiOperation({
    summary: 'Get all sender chain keys stored for me in this chat',
    description:
      'Returns the encrypted chain key each sender distributed to this user. ' +
      'Used when joining a chat or fetching after a rotation (bump in keyVersion).',
  })
  getChatSenderKeys(
    @CurrentUser() user: CurrentUserType,
    @Param('chatId', ParseUUIDPipe) chatId: string,
  ) {
    return this.senderKeysService.getChatSenderKeys(chatId, user.userId);
  }

  @Get('/:senderId')
  @ApiOperation({ summary: "Get a specific sender's chain key for this user" })
  @ApiQuery({
    name: 'recipientId',
    required: false,
    description: 'Defaults to current user',
  })
  getSenderKey(
    @CurrentUser() user: CurrentUserType,
    @Param('chatId', ParseUUIDPipe) chatId: string,
    @Param('senderId', ParseUUIDPipe) senderId: string,
    @Query('recipientId') recipientId?: string,
  ) {
    return this.senderKeysService.getSenderKey(
      chatId,
      senderId,
      recipientId ?? user.userId,
    );
  }
}
