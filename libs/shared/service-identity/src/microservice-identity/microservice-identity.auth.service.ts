import { ServiceIdentityGrpcClient } from '@gomin/grpc';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { MICROSERVICE_IDENTITY_OPTIONS } from './microservice-identity.tokens';
import type { MicroserviceIdentityOptions } from './microservice-identity.module';
import { MicroserviceIdentityStore } from './microservice-identity.store';

const TOKEN_BUFFER_MS = 60_000; // re-auth 1 min before expiry

/**
 * Handles service authentication and token lifecycle.
 * Fetches and caches access tokens; performs re-auth when expired.
 */
@Injectable()
export class MicroserviceIdentityAuthService {
  private readonly logger = new Logger(MicroserviceIdentityAuthService.name);

  constructor(
    private readonly serviceIdentityClient: ServiceIdentityGrpcClient,
    @Inject(MICROSERVICE_IDENTITY_OPTIONS)
    private readonly options: MicroserviceIdentityOptions,
    private readonly store: MicroserviceIdentityStore,
  ) {}

  private inflightAuthenticate: Promise<string | null> | null = null;

  async getAccessToken(): Promise<string | null> {
    if (this.isTokenValid()) {
      return this.store.getAuthToken()?.accessToken ?? null;
    }
    // Deduplicate concurrent re-auth: only one call reaches the auth service;
    // all others await the same promise instead of stampeding.
    if (!this.inflightAuthenticate) {
      this.inflightAuthenticate = this.authenticate().finally(() => {
        this.inflightAuthenticate = null;
      });
    }
    return this.inflightAuthenticate;
  }

  private isTokenValid(): boolean {
    const tokenCache = this.store.getAuthToken();
    if (!tokenCache) return false;
    return tokenCache.expiresAt > Date.now() + TOKEN_BUFFER_MS;
  }

  private async authenticate(): Promise<string | null> {
    try {
      const response = await firstValueFrom(
        this.serviceIdentityClient.authenticateServiceIdentity({
          serviceName: this.options.serviceName,
          serviceSecret: this.options.serviceSecret,
        }),
      );
      this.store.setAuthToken(response.accessToken, response.expiresAt);

      return response.accessToken;
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }
}
