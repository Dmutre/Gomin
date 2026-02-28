import { Injectable } from '@nestjs/common';
import { MicroserviceException } from '@gomin/app';
import { status } from '@grpc/grpc-js';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { createSign } from 'crypto';
import type {
  AuthenticateServiceIdentityResponse,
  GetPublicKeysResponse,
  JwtPublicKey,
} from '@gomin/grpc';
import { ServiceIdentityRepository } from './service-identity.repository';
import type { JwtSigningKeyConfig } from '../config/config';
import type { ServiceIdentityDomainModel } from './types/service-identity.domain.model';
import type {
  ServiceTokenHeader,
  ServiceTokenPayload,
} from '@gomin/service-identity';

@Injectable()
export class ServiceIdentityService {
  private readonly TOKEN_EXPIRATION_SECONDS = 3600;

  constructor(
    private readonly serviceIdentityRepository: ServiceIdentityRepository,
    private readonly configService: ConfigService,
  ) {}

  async authenticateServiceIdentity(
    serviceName: string,
    serviceSecret: string,
  ): Promise<AuthenticateServiceIdentityResponse> {
    const serviceIdentity =
      await this.serviceIdentityRepository.findByServiceNameWithPermissions(
        serviceName,
      );

    if (!serviceIdentity) {
      throw new MicroserviceException(
        'Invalid service credentials',
        status.UNAUTHENTICATED,
      );
    }

    await this.verifyServiceSecret(serviceIdentity, serviceSecret);

    return this.issueServiceToken(serviceIdentity);
  }

  getPublicKeys(): GetPublicKeysResponse {
    const keys =
      this.configService.get<JwtSigningKeyConfig[]>('jwt.signingKeys') ?? [];

    const publicKeys: JwtPublicKey[] = keys.map(
      (k): JwtPublicKey => ({
        keyId: k.keyId,
        publicKey: k.publicKey,
      }),
    );

    return { publicKeys };
  }

  private async verifyServiceSecret(
    serviceIdentity: ServiceIdentityDomainModel,
    rawSecret: string,
  ): Promise<void> {
    const isValid = await argon2.verify(serviceIdentity.secretHash, rawSecret);

    if (!isValid) {
      throw new MicroserviceException(
        'Invalid service credentials',
        status.UNAUTHENTICATED,
      );
    }
  }

  private issueServiceToken(
    serviceIdentity: ServiceIdentityDomainModel,
  ): AuthenticateServiceIdentityResponse {
    const activeKey = this.configService.get<JwtSigningKeyConfig | null>(
      'jwt.activeKey',
    );

    if (!activeKey) {
      throw new MicroserviceException(
        'No JWT signing key configured',
        status.FAILED_PRECONDITION,
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + this.TOKEN_EXPIRATION_SECONDS;

    const payload: ServiceTokenPayload = {
      sub: serviceIdentity.id,
      iat: now,
      exp: expiresAt,
      type: 'service',
      serviceName: serviceIdentity.serviceName,
      permissions: serviceIdentity.permissions,
    };

    const accessToken = this.signJwt(payload, activeKey);

    return { accessToken, expiresAt };
  }

  private signJwt(
    payload: ServiceTokenPayload,
    signingKey: JwtSigningKeyConfig,
  ): string {
    const header: ServiceTokenHeader = {
      alg: 'RS256',
      typ: 'JWT',
      kid: signingKey.keyId,
    };

    const headerB64 = this.base64UrlEncode(JSON.stringify(header));
    const payloadB64 = this.base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${headerB64}.${payloadB64}`;

    const sign = createSign('RSA-SHA256');
    sign.update(signingInput);
    sign.end();

    const signature = sign.sign(signingKey.privateKey, 'base64url');

    return `${signingInput}.${signature}`;
  }

  private base64UrlEncode(str: string): string {
    return Buffer.from(str, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
