export type DomainMessageStatusValue = 'SENT' | 'DELIVERED' | 'READ';

export interface MessageStatusDomainModel {
  messageId: string;
  userId: string;
  status: DomainMessageStatusValue;
  deliveredAt: Date | null;
  readAt: Date | null;
}
