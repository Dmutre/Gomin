import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('ServiceIdentities', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('serviceName').notNullable().unique();
    table.string('secretHash').notNullable();
    table.boolean('isActive').notNullable().defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('Permissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable().unique();
    table.string('description').nullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('ServicePermissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('serviceIdentityId')
      .notNullable()
      .references('id')
      .inTable('ServiceIdentities')
      .onDelete('CASCADE');
    table
      .uuid('permissionId')
      .notNullable()
      .references('id')
      .inTable('Permissions')
      .onDelete('CASCADE');
    table.timestamp('grantedAt').defaultTo(knex.fn.now());

    table.unique(['serviceIdentityId', 'permissionId']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('ServicePermissions');
  await knex.schema.dropTable('Permissions');
  await knex.schema.dropTable('ServiceIdentities');
}
