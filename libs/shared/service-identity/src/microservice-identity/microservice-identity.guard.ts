import type { ServiceTokenPayload } from '../auth-token/service-identity-token.payload';
import type { Permission } from '../permissions/permissions.types';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RpcException } from '@nestjs/microservices';
import type { Metadata } from '@grpc/grpc-js';
import { MicroserviceIdentityStore } from './microservice-identity.store';
import { verifyJwtRs256 } from './jwt-verifier';

export const REQUIRE_PERMISSION_KEY = 'requirePermission';

export const RequirePermission = (permission: Permission) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, permission);

@Injectable()
export class MicroserviceIdentityGuard implements CanActivate {
  constructor(
    private readonly store: MicroserviceIdentityStore,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rpcContext = context.switchToRpc();
    const metadata = rpcContext.getContext() as Metadata;
    const data = rpcContext.getData();

    const authHeader = this.getAuthorizationHeader(metadata);
    if (!authHeader?.startsWith('Bearer ')) {
      throw new RpcException(
        new UnauthorizedException('Missing or invalid Authorization header'),
      );
    }

    const token = authHeader.slice(7);
    const payload = await this.verifyToken(token);

    const requiredPermission = this.reflector.get<Permission | undefined>(
      REQUIRE_PERMISSION_KEY,
      context.getHandler(),
    );

    const permissions = payload.permissions ?? [];
    if (requiredPermission && !permissions.includes(requiredPermission)) {
      throw new RpcException(
        new ForbiddenException(
          `Permission '${requiredPermission}' is required`,
        ),
      );
    }

    this.attachPayload(data, payload);
    return true;
  }

  private getAuthorizationHeader(metadata: Metadata): string | undefined {
    const map = metadata.getMap();
    const auth = map['authorization'] ?? map['Authorization'];
    return typeof auth === 'string' ? auth : undefined;
  }

  private async verifyToken(token: string): Promise<ServiceTokenPayload> {
    const [headerB64] = token.split('.');
    if (!headerB64) {
      throw new RpcException(new UnauthorizedException('Invalid token format'));
    }

    const header = JSON.parse(
      Buffer.from(
        headerB64.replace(/-/g, '+').replace(/_/g, '/'),
        'base64',
      ).toString('utf8'),
    ) as { kid?: string };

    const kid = header.kid;
    if (!kid) {
      throw new RpcException(new UnauthorizedException('Token missing key id'));
    }

    const publicKey = await this.store.getPublicKey(kid);
    if (!publicKey) {
      throw new RpcException(new UnauthorizedException('Unknown signing key'));
    }

    const { payload } = verifyJwtRs256(token, publicKey);

    if (payload['type'] !== 'service') {
      throw new RpcException(new UnauthorizedException('Invalid token type'));
    }

    return payload as unknown as ServiceTokenPayload;
  }

  private attachPayload(
    data: Record<string, unknown>,
    payload: ServiceTokenPayload,
  ): void {
    (
      data as Record<string, unknown> & {
        _servicePayload?: ServiceTokenPayload;
      }
    )._servicePayload = payload;
  }
}
