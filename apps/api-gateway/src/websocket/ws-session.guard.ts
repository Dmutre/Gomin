import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import { SessionGuard } from '../auth/guards/session.guard';
import type { CurrentUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class WsSessionGuard implements CanActivate {
  constructor(private readonly sessionGuard: SessionGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const socket: Socket = context.switchToWs().getClient<Socket>();

    const token = (socket.data['user'] as CurrentUser | undefined)
      ?.sessionToken;

    if (!token) {
      socket.disconnect(true);
      throw new WsException('Not authenticated');
    }

    try {
      const user = await this.sessionGuard.resolveSession(token);
      socket.data['user'] = { ...user, sessionToken: token } satisfies CurrentUser;
      return true;
    } catch {
      socket.disconnect(true);
      throw new WsException('Session expired or revoked');
    }
  }
}
