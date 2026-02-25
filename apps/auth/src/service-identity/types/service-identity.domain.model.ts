import { Permission, ServiceIdentity } from '@gomin/service-identity';

export interface ServiceIdentityDomainModel {
  id: string;
  serviceName: ServiceIdentity;
  secretHash: string;
  isActive: boolean;
  createdAt: Date;
  permissions: Permission[];
}
