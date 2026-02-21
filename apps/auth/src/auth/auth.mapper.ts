import { UserProfile, SessionInfo, DeviceType } from '@gomin/grpc';
import type { UserDomainModel } from '../users/types/user.domain.model';
import {
  DomainDeviceType,
  UserSessionDomainModel,
} from '../user-sessions/types/user-session.domain.model';

export function toUserProfile(user: UserDomainModel): UserProfile {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone ?? '',
    avatarUrl: user.avatarUrl ?? '',
    bio: user.bio ?? '',
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

function mapDeviceDomainToProtoDeviceType(
  deviceType: DomainDeviceType | null,
): DeviceType {
  if (!deviceType) return DeviceType.DEVICE_TYPE_UNSPECIFIED;
  switch (deviceType) {
    case DomainDeviceType.MOBILE:
      return DeviceType.DEVICE_TYPE_MOBILE;
    case DomainDeviceType.DESKTOP:
      return DeviceType.DEVICE_TYPE_DESKTOP;
    case DomainDeviceType.TABLET:
      return DeviceType.DEVICE_TYPE_TABLET;
    case DomainDeviceType.WEB:
      return DeviceType.DEVICE_TYPE_WEB;
    default:
      return DeviceType.DEVICE_TYPE_UNSPECIFIED;
  }
}

export function toSessionInfo(
  session: UserSessionDomainModel,
  isCurrent: boolean,
): SessionInfo {
  return {
    sessionToken: session.sessionToken,
    deviceName: session.deviceName ?? '',
    deviceType: mapDeviceDomainToProtoDeviceType(session.deviceType),
    os: session.os ?? '',
    browser: session.browser ?? '',
    ipAddress: session.ipAddress,
    country: session.country ?? '',
    city: session.city ?? '',
    createdAt: session.createdAt,
    lastActivityAt: session.lastActivityAt,
    expiresAt: session.expiresAt,
    isCurrent,
  };
}
