export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface Session {
  sessionToken: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  createdAt: string;
  expiresAt: string;
  lastActivityAt?: string;
  isCurrent?: boolean;
}

export type ChatType = 'DIRECT' | 'GROUP' | 'CHANNEL';
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface ChatMember {
  userId: string;
  username?: string;
  role: MemberRole;
  joinedAt: string;
}

export interface Chat {
  id: string;
  type: ChatType;
  name?: string;
  members: ChatMember[];
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: string;
}

export interface MessagePayload {
  encryptedContent: string;
  iv: string;
  authTag: string;
  keyVersion: number;
  iteration: number;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderUsername?: string;
  type: MessageType;
  payload: MessagePayload;
  replyToMessageId?: string;
  replyTo?: Message;
  reactions?: MessageReaction[];
  readBy?: string[];
  isEdited?: boolean;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  decryptedContent?: string;
}

export interface SenderKey {
  id?: string;
  chatId: string;
  senderId: string;
  recipientId: string;
  encryptedSenderKey: string;
  keyVersion: number;
  createdAt?: string;
}

export interface E2eeKeys {
  publicKey: string;
  encryptedPrivateKey: string;
  encryptionSalt: string;
  encryptionIv: string;
  encryptionAuthTag: string;
}

export type DeviceType = 'MOBILE' | 'DESKTOP' | 'TABLET' | 'WEB';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: DeviceType;
  os: string;
  browser: string;
  appVersion: string;
  ipAddress?: string;
  userAgent: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  e2eeKeys: E2eeKeys;
  deviceInfo: DeviceInfo;
}

export interface LoginDto {
  email: string;
  password: string;
  deviceInfo: DeviceInfo;
}

export interface LoginResponse {
  user: User;
  sessionToken: string;
  expiresAt: string;
  e2eeKeys: E2eeKeys;
}

export interface TypingEvent {
  chatId: string;
  userId: string;
  username: string;
}

export interface PresenceEvent {
  userId: string;
  online: boolean;
}

export interface SenderKeyDistributeEvent {
  chatId: string;
  senderId: string;
  encryptedSenderKey: string;
  keyVersion: number;
}
