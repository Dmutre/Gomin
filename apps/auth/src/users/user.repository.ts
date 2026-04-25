import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectConnection } from 'nest-knexjs';
import { RedisService } from '@gomin/redis';
import { UserDomainModel } from './types/user.domain.model';
import { UserDb } from './types/user.db';
import { UserMapper } from './user.mapper';

export type UserUpdatePatch = Partial<
  Pick<
    UserDb,
    | 'passwordHash'
    | 'publicKey'
    | 'encryptedPrivateKey'
    | 'encryptionSalt'
    | 'encryptionIv'
    | 'encryptionAuthTag'
  >
>;

const USER_TTL_SECONDS = 300;

@Injectable()
export class UserRepository {
  private readonly tableName = 'Users';

  constructor(
    @InjectConnection() private readonly knex: Knex,
    private readonly redis: RedisService,
  ) {}

  private userCacheKey(id: string): string {
    return `user:${id}`;
  }

  async findByUsername(username: string): Promise<UserDomainModel | null> {
    const userDb = await this.knex<UserDb>(this.tableName)
      .where({ username })
      .first();
    return userDb ? UserMapper.toDomainModel(userDb) : null;
  }

  async findByUsernames(usernames: string[]): Promise<UserDomainModel[]> {
    if (usernames.length === 0) return [];
    const rows = await this.knex<UserDb>(this.tableName).whereIn(
      'username',
      usernames,
    );
    return rows.map(UserMapper.toDomainModel);
  }

  async findByEmail(email: string): Promise<UserDomainModel | null> {
    const userDb = await this.knex<UserDb>(this.tableName)
      .where({ email })
      .first();
    return userDb ? UserMapper.toDomainModel(userDb) : null;
  }

  async findById(id: string): Promise<UserDomainModel | null> {
    const cached = await this.redis.get(this.userCacheKey(id));
    if (cached) {
      const raw = JSON.parse(cached) as UserDomainModel;
      return {
        ...raw,
        createdAt: new Date(raw.createdAt),
        updatedAt: new Date(raw.updatedAt),
        bannedAt: raw.bannedAt ? new Date(raw.bannedAt) : null,
      };
    }

    const userDb = await this.knex<UserDb>(this.tableName)
      .where({ id })
      .first();
    if (!userDb) return null;

    const model = UserMapper.toDomainModel(userDb);
    await this.redis.set(
      this.userCacheKey(id),
      JSON.stringify(model),
      USER_TTL_SECONDS,
    );
    return model;
  }

  async createUser(user: UserDomainModel): Promise<UserDomainModel> {
    const userEntity = UserMapper.toEntity(user);
    const [userDb] = await this.knex<UserDb>(this.tableName)
      .insert(userEntity)
      .returning('*');
    return UserMapper.toDomainModel(userDb);
  }

  async updateById(
    id: string,
    patch: UserUpdatePatch,
  ): Promise<UserDomainModel | null> {
    const [userDb] = await this.knex<UserDb>(this.tableName)
      .where({ id })
      .update({ ...patch, updatedAt: new Date() })
      .returning('*');
    if (!userDb) return null;

    const model = UserMapper.toDomainModel(userDb);
    await this.redis.set(
      this.userCacheKey(id),
      JSON.stringify(model),
      USER_TTL_SECONDS,
    );
    return model;
  }
}
