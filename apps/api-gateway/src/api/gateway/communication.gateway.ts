import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Logger } from "nestjs-pino";
import * as WebSocket from 'ws';
import * as http from 'http';
import { AuthService } from "../auth/auth.service";
import { firstValueFrom } from "rxjs";

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
      this.sendMessage(ws, 'error', { message: 'No event specified' });
      return;
    }

    switch (message.event) {
      default:
        this.sendMessage(ws, 'error', { message: 'Unknown event' });
    }
  }
}