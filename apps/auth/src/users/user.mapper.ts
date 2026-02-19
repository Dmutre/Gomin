import { UserDb } from './types/user.db'
import { UserDomainModel } from './types/user.domain.model'

export class UserMapper {
  static toDomainModel(user: UserDb): UserDomainModel {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      passwordHash: user.passwordHash,
      publicKey: user.publicKey,
      encryptedPrivateKey: user.encryptedPrivateKey,
      encryptionSalt: user.encryptionSalt,
      encryptionIv: user.encryptionIv,
      encryptionAuthTag: user.encryptionAuthTag,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      isActive: user.isActive,
      isBanned: user.isBanned,
      bannedAt: user.bannedAt,
      banReason: user.banReason,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  static toEntity(user: UserDomainModel): UserDb {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      passwordHash: user.passwordHash,
      publicKey: user.publicKey,
      encryptedPrivateKey: user.encryptedPrivateKey,
      encryptionSalt: user.encryptionSalt,
      encryptionIv: user.encryptionIv,
      encryptionAuthTag: user.encryptionAuthTag,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      isActive: user.isActive,
      isBanned: user.isBanned,
      bannedAt: user.bannedAt,
      banReason: user.banReason,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}