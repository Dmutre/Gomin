import { Prisma } from "@my-prisma/client/communication";

export const MESSAGE_FULL_INCLUDE = Prisma.validator<Prisma.MessageDefaultArgs>()({
  include: {
    replyTo: true
  }
});

export type MessageFull = Prisma.MessageGetPayload<typeof MESSAGE_FULL_INCLUDE>;