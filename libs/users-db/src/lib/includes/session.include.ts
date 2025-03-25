import { Prisma } from "@my-prisma/client/users";

export const SESSION_FULL_INCLUDE = Prisma.validator<Prisma.SessionDefaultArgs>()({
  include: {
    token: true,
    user: {
      include: {
        userSetting: true,
      },
    },
  },
});

export type SessionFull = Prisma.SessionGetPayload<typeof SESSION_FULL_INCLUDE>;
