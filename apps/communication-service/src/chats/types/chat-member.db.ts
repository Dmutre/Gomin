export type ChatMemberRoleDb = 'OWNER' | 'ADMIN' | 'MEMBER';

export type ChatMemberDb = {
  chatId: string;
  userId: string;
  role: ChatMemberRoleDb;
  joinedAt: Date;
  canReadFrom: Date | null;
  leftAt: Date | null;
};
