import { Permission, ServiceIdentity } from '@gomin/service-identity';

export type ServiceIdentityDb = {
  id: string;
  serviceName: ServiceIdentity;
  secretHash: string;
  isActive: boolean;
  createdAt: Date;
};

export type ServiceIdentityDbWithPermissions = ServiceIdentityDb & {
  permissions: Permission[];
};

export type ServicePermissionDb = {
  serviceIdentityId: string;
  permissionId: string;
};

export type PermissionDb = {
  id: string;
  name: Permission;
  description: string;
};
