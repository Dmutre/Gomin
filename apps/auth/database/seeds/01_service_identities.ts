import type { Knex } from 'knex';
import { seedServiceIdentities } from '@gomin/service-identity';
import * as dotenv from 'dotenv';

dotenv.config();

export async function seed(knex: Knex): Promise<void> {
  await seedServiceIdentities(knex);
}
