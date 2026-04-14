export type DomainChatMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface ChatMemberDomainModel {
  chatId: string;
  userId: string;
  role: DomainChatMemberRole;
  joinedAt: Date;
  canReadFrom: Date | null;
  leftAt: Date | null;
}
