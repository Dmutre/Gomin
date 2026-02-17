import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // ============================================
  // USERS TABLE
  // ============================================
  await knex.schema.createTable('Users', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Basic info
    table.string('username', 100).notNullable().unique();
    table.string('email', 255).notNullable().unique();
    table.string('phone', 50).nullable().unique();
    table.string('passwordHash', 255).notNullable();
    
    // E2EE keys
    table.text('publicKey').nullable();
    table.text('encryptedPrivateKey').nullable();
    table.string('encryptionSalt', 255).nullable();
    table.string('encryptionIv', 255).nullable();
    table.string('encryptionAuthTag', 255).nullable();
    
    // Profile
    table.string('avatarUrl', 500).nullable();
    table.text('bio').nullable();
    
    // Verification
    table.boolean('emailVerified').defaultTo(false);
    table.boolean('phoneVerified').defaultTo(false);
    
    // Account status
    table.boolean('isActive').defaultTo(true);
    table.boolean('isBanned').defaultTo(false);
    table.timestamp('bannedAt').nullable();
    table.text('banReason').nullable();
    
    // Timestamps
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('email');
    table.index('username');
    table.index('phone');
    table.index(['isActive', 'isBanned']);
  });

  // ============================================
  // USER SESSIONS TABLE
  // ============================================
  await knex.schema.createTable('UserSessions', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Foreign key
    table.uuid('userId').notNullable()
      .references('id').inTable('Users')
      .onDelete('CASCADE');
    
    // Session token
    table.string('sessionTokenHash', 255).notNullable().unique();
    
    // Device info
    table.string('deviceId', 255).nullable();
    table.string('deviceName', 255).nullable();
    table.enum('deviceType', ['mobile', 'desktop', 'tablet', 'web']).nullable();
    table.string('os', 100).nullable();
    table.string('browser', 100).nullable();
    table.string('appVersion', 50).nullable();
    
    // Network info
    table.specificType('ipAddress', 'INET').notNullable();
    table.string('country', 2).nullable();
    table.string('city', 100).nullable();
    table.text('userAgent').nullable();
    
    // Timestamps
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('lastActivityAt').defaultTo(knex.fn.now());
    table.timestamp('expiresAt').notNullable();
    
    // Status
    table.boolean('isActive').defaultTo(true);
    table.timestamp('revokedAt').nullable();
    table.enum('revokeReason', [
      'user_logout',
      'user_terminated',
      'user_terminated_all',
      'expired',
      'inactivity',
      'security_breach',
      'admin_action',
      'token_reuse_detected',
      'session_limit_reached',
    ]).nullable();
    
    // Indexes
    table.index('userId');
    table.index('sessionTokenHash');
    table.index(['userId', 'isActive']);
    table.index('deviceId');
    table.index('expiresAt');
    table.index('lastActivityAt');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('UserSessions');
  await knex.schema.dropTableIfExists('Users');
  await knex.raw('DROP EXTENSION IF EXISTS "uuid-ossp"');
}