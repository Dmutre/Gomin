import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { status } from '@grpc/grpc-js';
import type { Metadata } from '@grpc/grpc-js';
import { MicroserviceException } from '@gomin/app';
import {
  JwtVerificationError,
  REQUIRE_PERMISSION_KEY,
  SERVICE_PAYLOAD_KEY,
  verifyJwtRs256,
} from '@gomin/service-identity';
import type { Permission, ServiceTokenPayload } from '@gomin/service-identity';
import { LocalIdentityService } from './local-identity.service';

@Injectable()
export class LocalIdentityGuard implements CanActivate {
  constructor(
    private readonly localIdentityService: LocalIdentityService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = context.switchToRpc().getContext<Metadata>();

    const token = this.extractToken(metadata);
    const payload = await this.verifyToken(token);

    this.checkPermissions(context, payload.permissions);

    context.switchToRpc().getData()[SERVICE_PAYLOAD_KEY] = payload;

    return true;
  }

  private extractToken(metadata: Metadata): string {
    const map = metadata.getMap();
    const authHeader = map['authorization'] ?? map['Authorization'];

    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      throw new MicroserviceException(
        'Missing or invalid authorization header',
        status.UNAUTHENTICATED,
      );
    }

    return authHeader.slice(7);
  }

  private async verifyToken(token: string): Promise<ServiceTokenPayload> {
    const kid = this.extractKid(token);
    const publicKey = this.localIdentityService.getPublicKey(kid);

    if (!publicKey) {
      throw new MicroserviceException(
        'Unknown signing key',
        status.UNAUTHENTICATED,
      );
    }

    let payload: Record<string, unknown>;

    try {
      const result = verifyJwtRs256(token, publicKey);
      payload = result.payload;
    } catch (error) {
      throw new MicroserviceException(
        error instanceof JwtVerificationError
          ? error.message
          : 'Token verification failed',
        status.UNAUTHENTICATED,
      );
    }

    if (!payload['type'] || payload['type'] !== 'service') {
      throw new MicroserviceException(
        'Invalid token type',
        status.UNAUTHENTICATED,
      );
    }

    const now = Math.floor(Date.now() / 1000);
    if (!payload['exp'] || (payload['exp'] as number) < now) {
      throw new MicroserviceException('Token expired', status.UNAUTHENTICATED);
    }

    return payload as unknown as ServiceTokenPayload;
  }

  private extractKid(token: string): string {
    const [headerB64] = token.split('.');

    if (!headerB64) {
      throw new MicroserviceException(
        'Invalid token format',
        status.UNAUTHENTICATED,
      );
    }

    try {
      const header = JSON.parse(
        Buffer.from(headerB64, 'base64url').toString('utf8'),
      ) as { kid?: string };

      if (!header.kid) {
        throw new MicroserviceException(
          'Token missing key id',
          status.UNAUTHENTICATED,
        );
      }

      return header.kid;
    } catch {
      throw new MicroserviceException(
        'Invalid token header',
        status.UNAUTHENTICATED,
      );
    }
  }

  private checkPermissions(
    context: ExecutionContext,
    tokenPermissions: Permission[],
  ): void {
    const required = this.reflector.get<Permission[] | undefined>(
      REQUIRE_PERMISSION_KEY,
      context.getHandler(),
    );

    if (!required?.length) return;

    const missing = required.filter((p) => !tokenPermissions.includes(p));

    if (missing.length > 0) {
      throw new MicroserviceException(
        `Missing permissions: ${missing.join(', ')}`,
        status.PERMISSION_DENIED,
      );
    }
  }
}
