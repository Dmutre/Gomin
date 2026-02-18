import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import type { UserDomainModel } from './types/user.domain.model';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findByUsername(username: string): Promise<UserDomainModel | null> {
    return this.userRepository.findByUsername(username);
  }
}