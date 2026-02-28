import { ServiceIdentityGrpcClient } from '@gomin/grpc';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

/**
 * Caches public keys for JWT validation. Does NOT handle authentication.
 * Used by the guard to verify service tokens.
 */
@Injectable()
export class MicroserviceIdentityStore {
  private publicKeyCache = new Map<string, string>();
  private authTokenCache: { accessToken: string, expiresAt: number } | null = null;

  constructor(
    private readonly serviceIdentityClient: ServiceIdentityGrpcClient,
  ) {}

  async getPublicKey(kid: string): Promise<string | null> {
    const cached = this.publicKeyCache.get(kid);
    if (cached) return cached;

    await this.refreshPublicKeyCache();
    return this.publicKeyCache.get(kid) ?? null;
  }

  private async refreshPublicKeyCache(): Promise<void> {
    const response = await firstValueFrom(
      this.serviceIdentityClient.getPublicKeys(),
    );
    for (const key of response.publicKeys) {
      this.publicKeyCache.set(key.keyId, key.publicKey);
    }
  }

  setAuthToken(accessToken: string, expiresAt: number): void {
    this.authTokenCache = { accessToken, expiresAt };
  }

  getAuthToken(): { accessToken: string, expiresAt: number } | null {
    return this.authTokenCache;
  }
}
