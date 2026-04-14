export type ChatTypeDb = 'DIRECT' | 'GROUP' | 'CHANNEL';

export type ChatDb = {
  id: string;
  type: ChatTypeDb;
  name: string | null;
  keyVersion: number;
  createdAt: Date;
  updatedAt: Date;
};
