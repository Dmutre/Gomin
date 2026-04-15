import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Metadata } from '@grpc/grpc-js';
import { MicroserviceIdentityAuthService } from '@gomin/service-identity';
import { UserAuthGrpcClient } from '@gomin/grpc';
import type { Request } from 'express';

declare module 'express' {
  interface Request {
    user?: unknown;
  }
}
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.module';

const SESSION_CACHE_TTL = 300;

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly userAuthClient: UserAuthGrpcClient,
    private readonly identityAuthService: MicroserviceIdentityAuthService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionToken = this.extractToken(request);

    if (!sessionToken) {
      throw new UnauthorizedException('Missing session token');
    }

    const user = await this.resolveSession(sessionToken);
    request.user = { ...user, sessionToken };
    return true;
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers['authorization'];
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    return null;
  }

  async resolveSession(
    sessionToken: string,
  ): Promise<{ userId: string; username: string; email: string }> {
    const cacheKey = `session:${sessionToken}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as {
        userId: string;
        username: string;
        email: string;
      };
    }

    const serviceToken = await this.identityAuthService.getAccessToken();
    const metadata = new Metadata();
    if (serviceToken) metadata.add('authorization', `Bearer ${serviceToken}`);

    const response = await this.userAuthClient.validateSession(
      { sessionToken },
      metadata,
    );

    if (!response.valid) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const user = {
      userId: response.userId,
      username: response.username,
      email: response.email,
    };

    await this.redis.set(
      cacheKey,
      JSON.stringify(user),
      'EX',
      SESSION_CACHE_TTL,
    );
    return user;
  }
}
