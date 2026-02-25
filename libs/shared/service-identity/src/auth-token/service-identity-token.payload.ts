import type { Permission } from '../permissions/permissions.types';
import { ServiceIdentity } from '../service-identities/service.registry';

export interface ServiceTokenPayload {
  sub: string;
  iat: number;
  exp: number;
  type: 'service';
  serviceName: ServiceIdentity;
  permissions: Permission[];
}

export interface ServiceTokenHeader {
  alg: 'RS256';
  typ: 'JWT';
  kid: string;
}
