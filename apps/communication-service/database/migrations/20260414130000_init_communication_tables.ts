import type { Knex } from 'knex';
import {
  TABLE_CHAT_MEMBERS,
  TABLE_CHATS,
  TABLE_SENDER_KEYS,
  TABLE_MESSAGE_REACTIONS,
  TABLE_MESSAGES,
  TABLE_MESSAGE_STATUS,
} from '../table-names';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable(TABLE_CHATS, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.enum('type', ['DIRECT', 'GROUP']).notNullable().defaultTo('DIRECT');

    table.string('name', 255).nullable();

    table.integer('keyVersion').notNullable().defaultTo(1);

    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    table.index('type');
    table.index('createdAt');
  });

  await knex.schema.createTable(TABLE_CHAT_MEMBERS, (table) => {
    table
      .uuid('chatId')
      .notNullable()
      .references('id')
      .inTable(TABLE_CHATS)
      .onDelete('CASCADE');
    table.uuid('userId').notNullable();

    table
      .enum('role', ['OWNER', 'ADMIN', 'MEMBER'])
      .notNullable()
      .defaultTo('MEMBER');

    table.timestamp('joinedAt').notNullable().defaultTo(knex.fn.now());

    table.timestamp('canReadFrom').nullable();

    table.timestamp('leftAt').nullable();

    table.primary(['chatId', 'userId']);
    table.index('userId');
    table.index(['chatId', 'role']);
    table.index('leftAt');
  });

  await knex.schema.createTable(TABLE_MESSAGES, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table
      .uuid('chatId')
      .notNullable()
      .references('id')
      .inTable(TABLE_CHATS)
      .onDelete('CASCADE');
    table.uuid('senderId').notNullable();

    table.text('encryptedContent').notNullable();
    table.string('iv', 255).notNullable();
    table.string('authTag', 255).notNullable();

    table.integer('keyVersion').notNullable().defaultTo(1);
    // Sender key ratchet step — used by recipients to derive the correct messageKey
    table.integer('iteration').notNullable().defaultTo(0);

    table
      .enum('type', ['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'VOICE', 'SYSTEM'])
      .notNullable()
      .defaultTo('TEXT');

    table.boolean('isEdited').notNullable().defaultTo(false);
    table.boolean('isDeleted').notNullable().defaultTo(false);
    table.timestamp('deletedAt').nullable();

    table.uuid('replyToId').nullable().references('id').inTable(TABLE_MESSAGES);

    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    table.index('chatId');
    table.index('senderId');
    table.index(['chatId', 'createdAt']);
    table.index('replyToId');
    table.index('isDeleted');
  });

  await knex.schema.createTable(TABLE_SENDER_KEYS, (table) => {
    table
      .uuid('chatId')
      .notNullable()
      .references('id')
      .inTable(TABLE_CHATS)
      .onDelete('CASCADE');
    // The user whose chain key this entry belongs to
    table.uuid('senderId').notNullable();
    // The user this chain key is encrypted for (RSA-OAEP with their public key)
    table.uuid('recipientId').notNullable();

    // RSA-OAEP encrypted chain key (base64) — server never decrypts this
    table.text('encryptedSenderKey').notNullable();

    // Epoch this key belongs to — matches chats.keyVersion at distribution time
    table.integer('keyVersion').notNullable().defaultTo(1);

    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    table.primary(['chatId', 'senderId', 'recipientId']);
    table.index(['chatId', 'recipientId']);
  });

  await knex.schema.createTable(TABLE_MESSAGE_STATUS, (table) => {
    table
      .uuid('messageId')
      .notNullable()
      .references('id')
      .inTable(TABLE_MESSAGES)
      .onDelete('CASCADE');
    table.uuid('userId').notNullable();

    table
      .enum('status', ['SENT', 'DELIVERED', 'READ'])
      .notNullable()
      .defaultTo('SENT');

    table.timestamp('deliveredAt').nullable();
    table.timestamp('readAt').nullable();

    table.primary(['messageId', 'userId']);
    table.index(['userId', 'status']);
  });

  await knex.schema.createTable(TABLE_MESSAGE_REACTIONS, (table) => {
    table
      .uuid('messageId')
      .notNullable()
      .references('id')
      .inTable(TABLE_MESSAGES)
      .onDelete('CASCADE');
    table.uuid('userId').notNullable();

    table.string('emoji', 32).notNullable();

    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());

    table.primary(['messageId', 'userId', 'emoji']);
    table.index('messageId');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TABLE_MESSAGE_REACTIONS);
  await knex.schema.dropTableIfExists(TABLE_MESSAGE_STATUS);
  await knex.schema.dropTableIfExists(TABLE_SENDER_KEYS);
  await knex.schema.dropTableIfExists(TABLE_MESSAGES);
  await knex.schema.dropTableIfExists(TABLE_CHAT_MEMBERS);
  await knex.schema.dropTableIfExists(TABLE_CHATS);
  await knex.raw('DROP EXTENSION IF EXISTS "uuid-ossp"');
}
