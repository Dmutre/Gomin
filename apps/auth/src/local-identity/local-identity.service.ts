import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { JwtSigningKeyConfig } from '../config/config';

/**
 * Resolves public keys from local JWT config. Used by the auth service
 * to validate service tokens without making gRPC calls to itself.
 */
@Injectable()
export class LocalIdentityService {
  constructor(private readonly configService: ConfigService) {}

  getPublicKey(kid: string): string | null {
    const keys =
      this.configService.get<JwtSigningKeyConfig[]>('jwt.signingKeys') ?? [];
    const key = keys.find((k) => k.keyId === kid);
    return key?.publicKey ?? null;
  }
}
