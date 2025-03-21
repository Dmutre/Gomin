import { Prisma } from "@my-prisma/client/users";

export const SESSION_FULL_INCLUDE: Prisma.SessionInclude = {
  token: true,
} as const;

export type SessionFull = Prisma.SessionGetPayload<{ include: typeof SESSION_FULL_INCLUDE }>;
