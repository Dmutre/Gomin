import { Injectable } from '@nestjs/common';
import { UserRepository, type UserUpdatePatch } from './user.repository';
import type { UserDomainModel } from './types/user.domain.model';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findByUsername(username: string): Promise<UserDomainModel | null> {
    return this.userRepository.findByUsername(username);
  }

  async findByUsernames(usernames: string[]): Promise<UserDomainModel[]> {
    return this.userRepository.findByUsernames(usernames);
  }

  async findByIds(ids: string[]): Promise<UserDomainModel[]> {
    return this.userRepository.findByIds(ids);
  }

  async findByEmail(email: string): Promise<UserDomainModel | null> {
    return this.userRepository.findByEmail(email);
  }

  async findById(id: string): Promise<UserDomainModel | null> {
    return this.userRepository.findById(id);
  }

  async createUser(user: UserDomainModel): Promise<UserDomainModel> {
    return this.userRepository.createUser(user);
  }

  async updateUser(
    id: string,
    patch: UserUpdatePatch,
  ): Promise<UserDomainModel | null> {
    return this.userRepository.updateById(id, patch);
  }
}
