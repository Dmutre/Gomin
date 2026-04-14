import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  void knex;
  // Add communication domain tables in follow-up migrations.
}

export async function down(knex: Knex): Promise<void> {
  void knex;
  // Roll back domain tables when they exist.
}
