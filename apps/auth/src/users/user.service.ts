import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import type { UserDomainModel } from './types/user.domain.model';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findByUsername(username: string): Promise<UserDomainModel | null> {
    return this.userRepository.findByUsername(username);
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
}
