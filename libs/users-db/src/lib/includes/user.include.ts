import { Prisma } from '@my-prisma/client/users';
import { SESSION_FULL_INCLUDE } from './session.include';

export const USER_FULL_INCLUDE: Prisma.UserInclude = {
  tokens: true,
  sessions: { include: SESSION_FULL_INCLUDE },
  files: true,
  userSetting: true,
} as const;

export type UserFull = Prisma.UserGetPayload<{ include: typeof USER_FULL_INCLUDE }>;