import { Prisma } from '@prisma/client/users';

export const USER_FULL_INCLUDE: Prisma.UserInclude = {
  tokens: true,
  sessions: true,
  files: true,
  userSetting: true,
};

export type UserFull = Prisma.UserGetPayload<{ include: typeof USER_FULL_INCLUDE }>;