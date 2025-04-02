import { Prisma } from "@my-prisma/client/permissions";

export const USER_PERMISSION_FULL_INCLUDE = Prisma.validator<Prisma.UserPermissionDefaultArgs>()({
  include: {
    permission: true,
  },
});

export type UserPermissionFull = Prisma.UserPermissionGetPayload<typeof USER_PERMISSION_FULL_INCLUDE>;
