import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsSessionGuard } from './ws-session.guard';
import { RedisPubSubService, PubSubMessage } from './redis-pubsub.service';
import { SessionGuard } from '../auth/guards/session.guard';
import type { CurrentUser } from '../auth/decorators/current-user.decorator';

type WsUser = CurrentUser;

type ChannelHandler = (msg: PubSubMessage) => void;

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
export class MessagingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MessagingGateway.name);

  private readonly socketChannels = new Map<
    string,
    Map<string, ChannelHandler>
  >();

  private readonly userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly pubSub: RedisPubSubService,
    private readonly sessionGuard: SessionGuard,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(socket: Socket) {
    const token =
      (socket.handshake.auth as Record<string, string | undefined>).token ??
      (socket.handshake.query['token'] as string | undefined);

    if (!token) {
      socket.emit('error', { message: 'Missing session token' });
      socket.disconnect(true);
      return;
    }

    try {
      const user = await this.sessionGuard.resolveSession(token);
      socket.data['user'] = { ...user, sessionToken: token } satisfies WsUser;
    } catch {
      socket.emit('error', { message: 'Invalid or expired session' });
      socket.disconnect(true);
      return;
    }

    this.socketChannels.set(socket.id, new Map());

    const user = socket.data['user'] as WsUser;
    if (!this.userSockets.has(user.userId)) {
      this.userSockets.set(user.userId, new Set());
    }
    this.userSockets.get(user.userId).add(socket.id);

    // Auto-subscribe to the user's personal channel so they receive DMs /
    // presence events and sender-key deliveries without an extra round-trip.
    await this.subscribeSocketToChannel(
      socket,
      this.pubSub.userChannel(user.userId),
    );

    this.logger.debug(`Socket connected: ${socket.id} (user ${user.userId})`);
  }

  async handleDisconnect(socket: Socket) {
    await this.cleanupSocket(socket);
    this.logger.debug(`Socket disconnected: ${socket.id}`);
  }

  private async cleanupSocket(socket: Socket) {
    const user = socket.data['user'] as WsUser | undefined;
    if (user) {
      const sockets = this.userSockets.get(user.userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          this.userSockets.delete(user.userId);
          await this.pubSub.publish(this.pubSub.userChannel(user.userId), {
            event: 'presence:update',
            userId: user.userId,
            data: { userId: user.userId, online: false },
          });
        }
      }
    }

    const channels = this.socketChannels.get(socket.id);
    if (channels) {
      for (const [channel, handler] of channels.entries()) {
        await this.pubSub.unsubscribe(channel, handler);
      }
      this.socketChannels.delete(socket.id);
    }
  }

  private async subscribeSocketToChannel(socket: Socket, channel: string) {
    const channels = this.socketChannels.get(socket.id);
    if (!channels || channels.has(channel)) return;

    const handler: ChannelHandler = (message) => {
      socket.emit(message.event, message.data);
    };

    channels.set(channel, handler);
    await this.pubSub.subscribe(channel, handler);
  }

  private async unsubscribeSocketFromChannel(socket: Socket, channel: string) {
    const channels = this.socketChannels.get(socket.id);
    if (!channels) return;
    const handler = channels.get(channel);
    if (!handler) return;
    channels.delete(channel);
    await this.pubSub.unsubscribe(channel, handler);
  }

  private getUser(socket: Socket): WsUser {
    const user = socket.data['user'] as WsUser | undefined;
    if (!user) throw new WsException('Not authenticated');
    return user;
  }

  async broadcastToChat(
    chatId: string,
    event: PubSubMessage['event'],
    data: unknown,
  ): Promise<void> {
    await this.pubSub.publish(this.pubSub.chatChannel(chatId), {
      event,
      chatId,
      data,
    });
  }

  async broadcastToUser(
    userId: string,
    event: PubSubMessage['event'],
    data: unknown,
  ): Promise<void> {
    await this.pubSub.publish(this.pubSub.userChannel(userId), {
      event,
      userId,
      data,
    });
  }

  @UseGuards(WsSessionGuard)
  @SubscribeMessage('chat:subscribe')
  async handleChatSubscribe(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { chatId: string },
  ) {
    const user = this.getUser(socket);
    if (!payload?.chatId) throw new WsException('chatId required');

    await this.subscribeSocketToChannel(
      socket,
      this.pubSub.chatChannel(payload.chatId),
    );

    this.logger.debug(
      `User ${user.userId} subscribed to chat ${payload.chatId}`,
    );
    return { subscribed: true, chatId: payload.chatId };
  }

  @UseGuards(WsSessionGuard)
  @SubscribeMessage('chat:subscribe_many')
  async handleChatSubscribeMany(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { chatIds: string[] },
  ) {
    const user = this.getUser(socket);
    if (!Array.isArray(payload?.chatIds) || payload.chatIds.length === 0) {
      throw new WsException('chatIds must be a non-empty array');
    }

    await Promise.all(
      payload.chatIds.map((chatId) =>
        this.subscribeSocketToChannel(socket, this.pubSub.chatChannel(chatId)),
      ),
    );

    this.logger.debug(
      `User ${user.userId} subscribed to ${payload.chatIds.length} chats`,
    );
    return { subscribed: true, chatIds: payload.chatIds };
  }

  @UseGuards(WsSessionGuard)
  @SubscribeMessage('chat:unsubscribe')
  async handleChatUnsubscribe(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { chatId: string },
  ) {
    if (!payload?.chatId) throw new WsException('chatId required');
    await this.unsubscribeSocketFromChannel(
      socket,
      this.pubSub.chatChannel(payload.chatId),
    );
    return { unsubscribed: true, chatId: payload.chatId };
  }

  @UseGuards(WsSessionGuard)
  @SubscribeMessage('chat:unsubscribe_many')
  async handleChatUnsubscribeMany(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { chatIds: string[] },
  ) {
    if (!Array.isArray(payload?.chatIds) || payload.chatIds.length === 0) {
      throw new WsException('chatIds must be a non-empty array');
    }

    await Promise.all(
      payload.chatIds.map((chatId) =>
        this.unsubscribeSocketFromChannel(
          socket,
          this.pubSub.chatChannel(chatId),
        ),
      ),
    );
    return { unsubscribed: true, chatIds: payload.chatIds };
  }

  @UseGuards(WsSessionGuard)
  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { chatId: string },
  ) {
    const user = this.getUser(socket);
    if (!payload?.chatId) throw new WsException('chatId required');
    await this.broadcastToChat(payload.chatId, 'typing:start', {
      chatId: payload.chatId,
      userId: user.userId,
      username: user.username,
    });
  }

  @UseGuards(WsSessionGuard)
  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { chatId: string },
  ) {
    const user = this.getUser(socket);
    if (!payload?.chatId) throw new WsException('chatId required');
    await this.broadcastToChat(payload.chatId, 'typing:stop', {
      chatId: payload.chatId,
      userId: user.userId,
    });
  }

  @UseGuards(WsSessionGuard)
  @SubscribeMessage('presence:ping')
  async handlePresencePing(@ConnectedSocket() socket: Socket) {
    const user = this.getUser(socket);
    // User channel subscription happens at connection time; this just
    // confirms the user is online and updates any replicas that may have
    // missed the connection event.
    await this.pubSub.publish(this.pubSub.userChannel(user.userId), {
      event: 'presence:update',
      userId: user.userId,
      data: { userId: user.userId, online: true },
    });
    return { online: true, userId: user.userId };
  }

  @UseGuards(WsSessionGuard)
  @SubscribeMessage('sender_key:distribute')
  async handleDistributeSenderKey(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    payload: {
      chatId: string;
      recipientId: string;
      encryptedSenderKey: string;
      keyVersion: number;
    },
  ) {
    const user = this.getUser(socket);
    if (
      !payload?.chatId ||
      !payload?.recipientId ||
      !payload?.encryptedSenderKey
    ) {
      throw new WsException(
        'chatId, recipientId, and encryptedSenderKey are required',
      );
    }

    await this.broadcastToUser(payload.recipientId, 'sender_key:received', {
      chatId: payload.chatId,
      senderId: user.userId,
      encryptedSenderKey: payload.encryptedSenderKey,
      keyVersion: payload.keyVersion ?? 0,
    });

    return { delivered: true };
  }
}
