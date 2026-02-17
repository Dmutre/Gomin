export interface UserDomainModel {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  publicKey: string | null;
  encryptedPrivateKey: string | null;
  encryptionSalt: string | null;
  encryptionIv: string | null;
  encryptionAuthTag: string | null;
  avatarUrl: string | null;
  bio: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  isBanned: boolean;
  bannedAt: Date | null;
  banReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}
