import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Logger } from "nestjs-pino";
import * as WebSocket from 'ws';
import * as http from 'http';
import { AuthService } from "../auth/auth.service";
import { firstValueFrom } from "rxjs";
import { CommunicationClientEvent, CommunicationEvents } from "../../libs/websocket-events/communication.events";
import { SendMessageDTO } from "../../../../../libs/common/src";
import { MessageService } from "../messages/message.service";
import { ChatService } from "../chat/chat.service";

/**
 * TODO: Update WebSocket Gateway to connect for a specific amount of time based on token lifetime.
 */
@Injectable()
export class CommunicationGateway implements OnModuleDestroy {
  private server: WebSocket.Server;
  private clients: Map<string, WebSocket> = new Map();

  constructor(
    private readonly logger: Logger,
    private readonly authService: AuthService,
    private readonly messageService: MessageService,
    private readonly chatService: ChatService,
  ) {}

  onModuleDestroy() {
    this.clients.forEach((ws) => ws.close());
    this.server.close();
    this.clients.clear();
  }

  public setHttpServer(httpServer: http.Server) {
    this.server = new WebSocket.Server({
      server: httpServer,
      path: '/communication',
    });
    this.initialize();
  }

    private initialize() {
    this.server.on('connection', async (ws: WebSocket, request: http.IncomingMessage) => {
      const token = request.headers['token'] as string;
      const clientId = await this.authorizeUser(token);

      if (!clientId) {
        this.sendMessage(ws, 'unauthorized', { message: 'Invalid or expired token' });
        ws.close(4001, 'Unauthorized');
        return;
      }

      this.clients.set(clientId, ws);

      ws.on('message', async (message: string) => {
        try {
          const parsedMessage = JSON.parse(message);
          await this.handleMessage(clientId, ws, parsedMessage);
        } catch (err) {
          this.sendMessage(ws, 'error', { message: 'Invalid message format' });
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
      });

      ws.on('error', (err) => {
        ws.close();
        this.clients.delete(clientId);
      });
    });
  }

  private async authorizeUser(token: string | string[] | undefined): Promise<string | null> {
    try {
      if (!token || Array.isArray(token)) return null;
      const payload = await firstValueFrom(this.authService.getCurrentUser(token));
      return payload.id;
    } catch (err) {
      return null;
    }
  }

  private sendMessage(ws: WebSocket, event: string, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event, data }));
    }
  }

    private async handleMessage(clientId: string, ws: WebSocket, message: any) {
    if (!message.event) {
      this.sendErrorMessage(ws, 'No event specified');
      return;
    }

    switch (message.event) {
      case CommunicationEvents.SEND_MESSAGE:
        await this.handleSendMessage(ws, message.data);
        break;
      default:
        this.sendErrorMessage(ws, 'Unknown event');
    }
  }

  private sendErrorMessage(ws: WebSocket, message: string) {
    this.sendMessage(ws, 'error', { message });
  }

  private async handleSendMessage(ws: WebSocket, data: SendMessageDTO) {
    const chat = await firstValueFrom(this.chatService.getChatById(data.chatId));
    if (!chat) {
      this.sendErrorMessage(ws, 'Chat not found');
    }
    const message = await this.messageService.sendMessage(data);
    this.broadcastToUsers(
      chat.members.map((user) => user.id),
      CommunicationClientEvent.REVEICE_MESSAGE,
      message,
    );
  }

  private broadcastToUsers(userIds: string[], event: string, data: any) {
    for (const userId of userIds) {
      const ws = this.clients.get(userId);
      if (ws) this.sendMessage(ws, event, data);
    }
  }
}