export type MessageStatusValueDb = 'SENT' | 'DELIVERED' | 'READ';

export type MessageStatusDb = {
  messageId: string;
  userId: string;
  status: MessageStatusValueDb;
  deliveredAt: Date | null;
  readAt: Date | null;
};
