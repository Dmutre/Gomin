import { ServiceIdentityGrpcClient } from '@gomin/grpc';
import { Inject, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import {
  MICROSERVICE_IDENTITY_OPTIONS,
  MicroserviceIdentityOptions,
} from './microservice-identity.module';
import { MicroserviceIdentityStore } from './microservice-identity.store';

const TOKEN_BUFFER_MS = 60_000; // re-auth 1 min before expiry

/**
 * Handles service authentication and token lifecycle.
 * Fetches and caches access tokens; performs re-auth when expired.
 */
@Injectable()
export class MicroserviceIdentityAuthService {
  constructor(
    private readonly serviceIdentityClient: ServiceIdentityGrpcClient,
    @Inject(MICROSERVICE_IDENTITY_OPTIONS)
    private readonly options: MicroserviceIdentityOptions,
    private readonly store: MicroserviceIdentityStore,
  ) {}

  async getAccessToken(): Promise<string> {
    if (this.isTokenValid()) {
      return this.store.getAuthToken()!.accessToken;
    }
    return this.authenticate();
  }

  private isTokenValid(): boolean {
    const tokenCache = this.store.getAuthToken();
    if (!tokenCache) return false;
    return tokenCache.expiresAt > Date.now() + TOKEN_BUFFER_MS;
  }

  private async authenticate(): Promise<string> {
    const response = await firstValueFrom(
      this.serviceIdentityClient.authenticateServiceIdentity({
        serviceName: this.options.serviceName,
        serviceSecret: this.options.serviceSecret,
      }),
    );
    this.store.setAuthToken(response.accessToken, response.expiresAt);

    return response.accessToken;
  }
}
