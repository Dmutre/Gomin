export type DomainChatType = 'DIRECT' | 'GROUP' | 'CHANNEL';

export interface ChatDomainModel {
  id: string;
  type: DomainChatType;
  name: string | null;
  keyVersion: number;
  createdAt: Date;
  updatedAt: Date;
}
