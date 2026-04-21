import type { Knex } from 'knex';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';

dotenv.config();

const SERVICE_IDENTITIES_TABLE = 'ServiceIdentities';
const PERMISSIONS_TABLE = 'Permissions';
const SERVICE_PERMISSIONS_TABLE = 'ServicePermissions';

const PERMISSIONS = [
  {
    name: 'auth-service:users:read',
    description: 'Read user data from auth service',
  },
  {
    name: 'auth-service:users:write',
    description: 'Create or update users in auth service',
  },
  {
    name: 'auth-service:sessions:read',
    description: 'Read session data from auth service',
  },
  {
    name: 'auth-service:sessions:write',
    description: 'Create sessions in auth service',
  },
  {
    name: 'auth-service:sessions:invalidate',
    description: 'Invalidate user sessions in auth service',
  },
  {
    name: 'service-identity:public-keys:get',
    description: 'Get public keys for service identity',
  },
  {
    name: 'communication-service:chats:read',
    description: 'Read chat and member data from communication service',
  },
  {
    name: 'communication-service:chats:write',
    description: 'Create or modify chats in communication service',
  },
  {
    name: 'communication-service:messages:read',
    description: 'Read messages from communication service',
  },
  {
    name: 'communication-service:messages:write',
    description: 'Send or edit messages in communication service',
  },
  {
    name: 'communication-service:messages:delete',
    description: 'Delete messages in communication service',
  },
  {
    name: 'communication-service:message-keys:read',
    description:
      'Retrieve per-recipient wrapped AES keys from communication service',
  },
  {
    name: 'communication-service:message-keys:write',
    description:
      'Store per-recipient wrapped AES keys in communication service',
  },
];

const SERVICES: { name: string; permissions: string[] }[] = [
  {
    name: 'auth-service',
    permissions: [
      'auth-service:users:read',
      'auth-service:users:write',
      'auth-service:sessions:read',
      'auth-service:sessions:write',
      'auth-service:sessions:invalidate',
    ],
  },
  {
    name: 'gateway-service',
    permissions: [
      'auth-service:users:read',
      'auth-service:users:write',
      'auth-service:sessions:read',
      'auth-service:sessions:write',
      'auth-service:sessions:invalidate',
      'communication-service:chats:read',
      'communication-service:chats:write',
      'communication-service:messages:read',
      'communication-service:messages:write',
      'communication-service:messages:delete',
      'communication-service:message-keys:read',
      'communication-service:message-keys:write',
    ],
  },
  {
    name: 'communication-service',
    permissions: [
      'auth-service:users:read',
      'service-identity:public-keys:get',
    ],
  },
];

function getServiceSecret(serviceName: string): string {
  const envKey = `SERVICE_IDENTITY_${serviceName.toUpperCase().replace(/-/g, '_')}_SECRET`;
  const secret = process.env[envKey];
  if (!secret) {
    throw new Error(`Missing ${envKey} — set it for seeding service identity`);
  }
  return secret;
}

export async function seed(knex: Knex): Promise<void> {
  for (const perm of PERMISSIONS) {
    const exists = await knex(PERMISSIONS_TABLE)
      .where({ name: perm.name })
      .first();
    if (!exists) {
      await knex(PERMISSIONS_TABLE).insert(perm);
    }
  }

  for (const svc of SERVICES) {
    const existing = await knex(SERVICE_IDENTITIES_TABLE)
      .where({ serviceName: svc.name })
      .first();
    if (!existing) {
      const secretHash = await argon2.hash(getServiceSecret(svc.name));
      await knex(SERVICE_IDENTITIES_TABLE).insert({
        serviceName: svc.name,
        secretHash,
        isActive: true,
      });
    }
  }

  for (const svc of SERVICES) {
    const [service] = await knex(SERVICE_IDENTITIES_TABLE)
      .where({ serviceName: svc.name })
      .select('id');
    if (!service) continue;

    for (const permName of svc.permissions) {
      const [permission] = await knex(PERMISSIONS_TABLE)
        .where({ name: permName })
        .select('id');
      if (!permission) continue;

      const linkExists = await knex(SERVICE_PERMISSIONS_TABLE)
        .where({ serviceIdentityId: service.id, permissionId: permission.id })
        .first();
      if (!linkExists) {
        await knex(SERVICE_PERMISSIONS_TABLE).insert({
          serviceIdentityId: service.id,
          permissionId: permission.id,
        });
      }
    }
  }
}
