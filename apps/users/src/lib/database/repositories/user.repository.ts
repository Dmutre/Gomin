import { HttpStatus, Injectable } from '@nestjs/common';
import { USER_FULL_INCLUDE, UserFull, UsersPrismaService } from '@gomin/users-db';
import { User, Prisma } from '@my-prisma/client/users';
import { MicroserviceException } from '@gomin/common';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: UsersPrismaService) {}

  async createUser(data: Prisma.UserUncheckedCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findUserById(id: string): Promise<UserFull> {
    return this.prisma.user.findUnique({ where: { id }, ...USER_FULL_INCLUDE });
  }

  async findOrThrow(id: string): Promise<UserFull> {
    const user = await this.findUserById(id);
    if (!user) {
      throw new MicroserviceException(`User doesn't exist`, HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async findUserByEmail(email: string): Promise<UserFull | null> {
    return this.prisma.user.findUnique({ where: { email }, ...USER_FULL_INCLUDE });
  }

  async findUniqueUser(args: Prisma.UserFindUniqueArgs): Promise<UserFull | null> {
    return this.prisma.user.findUnique({ ...args, ...USER_FULL_INCLUDE }) as unknown as UserFull | null;
  }

  async findUser(args: Omit<Prisma.UserFindFirstArgs, 'include'>): Promise<UserFull | null> {
    return this.prisma.user.findFirst({ ...args, ...USER_FULL_INCLUDE }) as unknown as UserFull | null;
  }

  async updateUser(id: string, data: Partial<User>): Promise<UserFull> {
    return this.prisma.user.update({ where: { id }, data, ...USER_FULL_INCLUDE });
  }

  async deleteUser(id: string): Promise<User> {
    return this.prisma.user.delete({ where: { id } });
  }
}
