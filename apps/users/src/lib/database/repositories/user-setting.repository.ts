import { Injectable } from '@nestjs/common';
import { UsersPrismaService } from '@gomin/users-db';
import { UserSettings, Prisma } from '@prisma/client/users';

@Injectable()
export class UserSettingsRepository {
  constructor(private readonly prisma: UsersPrismaService) {}

  async createSettings(data: Prisma.UserSettingsUncheckedCreateInput): Promise<UserSettings> {
    return this.prisma.userSettings.create({ data });
  }

  async findSettingsByUserId(userId: string): Promise<UserSettings | null> {
    return this.prisma.userSettings.findUnique({ where: { userId } });
  }

  async updateSettings(userId: string, data: Prisma.UserSettingsUpdateInput): Promise<UserSettings> {
    return this.prisma.userSettings.update({ where: { userId }, data });
  }

  async deleteSettings(userId: string): Promise<UserSettings> {
    return this.prisma.userSettings.delete({ where: { userId } });
  }
}
