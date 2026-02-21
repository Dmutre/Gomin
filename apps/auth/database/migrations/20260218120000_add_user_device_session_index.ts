import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('UserSessions', (table) => {
    table.index(['userId', 'deviceId'], 'idx_user_sessions_user_device');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('UserSessions', (table) => {
    table.dropIndex(['userId', 'deviceId'], 'idx_user_sessions_user_device');
  });
}
