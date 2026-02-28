export { PERMISSIONS_REGISTRY } from './permissions/permissions.registry';
export { Permission } from './permissions/permissions.types';
export { ServiceIdentity } from './service-identities/service.registry';
export { SERVICES_SEED_CONFIG } from './seeding/seeding.config';
export type { ServiceSeedConfig } from './seeding/seeding.config';
export { seedServiceIdentities } from './seeding/service-identity.seeder';
export type {
  ServiceTokenPayload,
  ServiceTokenHeader,
} from './auth-token/service-identity-token.payload';

export {
  MicroserviceIdentityModule,
  MICROSERVICE_IDENTITY_OPTIONS,
} from './microservice-identity/microservice-identity.module';
export type { MicroserviceIdentityOptions } from './microservice-identity/microservice-identity.module';
export { MicroserviceIdentityAuthService } from './microservice-identity/microservice-identity.auth.service';
export { MicroserviceIdentityStore } from './microservice-identity/microservice-identity.store';
export {
  MicroserviceIdentityGuard,
  RequirePermission,
  REQUIRE_PERMISSION_KEY,
  SERVICE_PAYLOAD_KEY,
} from './microservice-identity/microservice-identity.guard';
export {
  JwtVerificationError,
  verifyJwtRs256,
} from './microservice-identity/jwt-verifier';
