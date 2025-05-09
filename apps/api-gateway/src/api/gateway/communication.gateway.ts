import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Logger } from "nestjs-pino";
import * as WebSocket from 'ws';
import * as http from 'http';

@Injectable()
export class CommunicationGateway implements OnModuleDestroy {
  private server: WebSocket.Server;
  private clients: Map<string, WebSocket> = new Map();

  constructor(
    private readonly logger: Logger,
  ) {}

  onModuleDestroy() {
    this.clients.forEach((ws) => ws.close());
    this.server.close();
    this.clients.clear();
  }

  public setHttpServer(httpServer: http.Server) {
    this.server = new WebSocket.Server({
      server: httpServer,
      path: '/matchmaker',
    });
    this.initialize();
  }

    private initialize() {
    this.server.on('connection', (ws: WebSocket) => {
      const clientId = 'TODO client authorization';
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
        this.clients.delete(clientId);
      });
    });
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