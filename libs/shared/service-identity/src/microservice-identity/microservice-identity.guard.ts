import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { status } from '@grpc/grpc-js';
import type { Metadata } from '@grpc/grpc-js';
import { MicroserviceException } from '@gomin/app';
import type { Permission } from '../permissions/permissions.types';
import type { ServiceTokenPayload } from '../auth-token/service-identity-token.payload';
import { MicroserviceIdentityStore } from './microservice-identity.store';
import { JwtVerificationError, verifyJwtRs256 } from './jwt-verifier';

export const REQUIRE_PERMISSION_KEY = 'requirePermission';

export const RequirePermission = (...permissions: Permission[]) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, permissions);

export const SERVICE_PAYLOAD_KEY = 'servicePayload';

@Injectable()
export class MicroserviceIdentityGuard implements CanActivate {
  constructor(
    private readonly store: MicroserviceIdentityStore,
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
    const publicKey = await this.resolvePublicKey(kid);
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

  private async resolvePublicKey(kid: string): Promise<string> {
    const publicKey = await this.store.getPublicKey(kid);

    if (!publicKey) {
      throw new MicroserviceException(
        'Unknown signing key',
        status.UNAUTHENTICATED,
      );
    }

    return publicKey;
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
