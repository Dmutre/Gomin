import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectConnection } from 'nest-knexjs';
import { UserDomainModel } from './types/user.domain.model';
import { UserDb } from './types/user.db';
import { UserMapper } from './user.mapper';

@Injectable()
export class UserRepository {
  private readonly tableName = 'Users';
  constructor(@InjectConnection() private readonly knex: Knex) {}

  async findByUsername(username: string): Promise<UserDomainModel | null> {
    const userDb = await this.knex<UserDb>(this.tableName)
      .where({ username })
      .first();
    return userDb ? UserMapper.toDomainModel(userDb) : null;
  }

  async findByEmail(email: string): Promise<UserDomainModel | null> {
    const userDb = await this.knex<UserDb>(this.tableName)
      .where({ email })
      .first();
    return userDb ? UserMapper.toDomainModel(userDb) : null;
  }

  async findById(id: string): Promise<UserDomainModel | null> {
    const userDb = await this.knex<UserDb>(this.tableName)
      .where({ id })
      .first();
    return userDb ? UserMapper.toDomainModel(userDb) : null;
  }

  async createUser(user: UserDomainModel): Promise<UserDomainModel> {
    const userEntity = UserMapper.toEntity(user);
    const [userDb] = await this.knex<UserDb>(this.tableName).insert(userEntity).returning('*');
    return UserMapper.toDomainModel(userDb);
  }
}