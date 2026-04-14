export type MessageTypeDb =
  | 'TEXT'
  | 'IMAGE'
  | 'VIDEO'
  | 'DOCUMENT'
  | 'VOICE'
  | 'SYSTEM';

export type MessageDb = {
  id: string;
  chatId: string;
  senderId: string;
  encryptedContent: string;
  iv: string;
  authTag: string;
  keyVersion: number;
  iteration: number;
  type: MessageTypeDb;
  isEdited: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  replyToId: string | null;
  createdAt: Date;
  updatedAt: Date;
};
