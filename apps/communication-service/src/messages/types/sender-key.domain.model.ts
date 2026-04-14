export interface SenderKeyDomainModel {
  chatId: string;
  senderId: string;
  recipientId: string;
  encryptedSenderKey: string;
  keyVersion: number;
  createdAt: Date;
  updatedAt: Date;
}
