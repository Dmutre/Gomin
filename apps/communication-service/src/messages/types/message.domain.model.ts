export type DomainMessageType =
  | 'TEXT'
  | 'IMAGE'
  | 'VIDEO'
  | 'DOCUMENT'
  | 'VOICE'
  | 'SYSTEM';

export interface MessageDomainModel {
  id: string;
  chatId: string;
  senderId: string;
  encryptedContent: string;
  iv: string;
  authTag: string;
  keyVersion: number;
  iteration: number;
  type: DomainMessageType;
  isEdited: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  replyToId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
