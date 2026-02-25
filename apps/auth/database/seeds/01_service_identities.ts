import type { Knex } from 'knex';
import { seedServiceIdentities } from '@gomin/service-identity';

export async function seed(knex: Knex): Promise<void> {
  await seedServiceIdentities(knex);
}
