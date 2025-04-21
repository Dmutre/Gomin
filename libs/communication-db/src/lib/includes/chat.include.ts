import { Prisma } from "@my-prisma/client/communication";

export const CHAT_FULL_INCLUDE = Prisma.validator<Prisma.ChatDefaultArgs>()({
  include: {
    messages: true,
    members: true,
  }
});

export type ChatFull = Prisma.ChatGetPayload<typeof CHAT_FULL_INCLUDE>;
