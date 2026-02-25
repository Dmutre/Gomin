import type { Knex } from 'knex';
import * as argon2 from 'argon2';
import { PERMISSIONS_REGISTRY } from '../permissions/permissions.registry';
import { SERVICES_SEED_CONFIG } from './seeding.config';

const SERVICE_IDENTITIES_TABLE = 'ServiceIdentities';
const PERMISSIONS_TABLE = 'Permissions';
const SERVICE_PERMISSIONS_TABLE = 'ServicePermissions';

function getServiceSecret(serviceName: string): string {
  const envKey = `SERVICE_IDENTITY_${serviceName.toUpperCase().replace(/-/g, '_')}_SECRET`;
  const secret = process.env[envKey];
  if (!secret) {
    throw new Error(
      `Missing ${envKey} - set it in .env for seeding service identity`,
    );
  }
  return secret;
}

export async function seedServiceIdentities(knex: Knex): Promise<void> {
  for (const perm of PERMISSIONS_REGISTRY) {
    const exists = await knex(PERMISSIONS_TABLE)
      .where({ name: perm.name })
      .first();
    if (!exists) {
      await knex(PERMISSIONS_TABLE).insert({
        name: perm.name,
        description: perm.description,
      });
    }
  }

  for (const config of SERVICES_SEED_CONFIG) {
    const existing = await knex(SERVICE_IDENTITIES_TABLE)
      .where({ serviceName: config.serviceName })
      .first();

    if (!existing) {
      const secret = getServiceSecret(config.serviceName);
      const secretHash = await argon2.hash(secret);
      await knex(SERVICE_IDENTITIES_TABLE).insert({
        serviceName: config.serviceName,
        secretHash,
        isActive: true,
      });
    }
  }

  for (const config of SERVICES_SEED_CONFIG) {
    const [service] = await knex(SERVICE_IDENTITIES_TABLE)
      .where({ serviceName: config.serviceName })
      .select('id');

    if (!service) continue;

    for (const permName of config.permissions) {
      const [permission] = await knex(PERMISSIONS_TABLE)
        .where({ name: permName })
        .select('id');

      if (!permission) continue;

      const linkExists = await knex(SERVICE_PERMISSIONS_TABLE)
        .where({
          serviceIdentityId: service.id,
          permissionId: permission.id,
        })
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
