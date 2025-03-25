import { Prisma } from '@my-prisma/client/users';

export const USER_FULL_INCLUDE = Prisma.validator<Prisma.UserDefaultArgs>()({
  include: {
    tokens: true,
    sessions: { include: { token: true } },
    files: true,
    userSetting: true,
  }
});

export type UserFull = Prisma.UserGetPayload<typeof USER_FULL_INCLUDE>;