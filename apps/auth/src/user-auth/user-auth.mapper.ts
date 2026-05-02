import { UserProfile, SessionInfo, DeviceType } from '@gomin/grpc';
import type { UserDomainModel } from '../users/types/user.domain.model';
import {
  DomainDeviceType,
  UserSessionDomainModel,
} from '../user-sessions/types/user-session.domain.model';

function toTimestamp(date: Date | null | undefined): Date | undefined {
  if (!date) return undefined;
  // proto-loader encodes google.protobuf.Timestamp from {seconds, nanos};
  // passing a plain Date object results in zeros. Cast so TypeScript is happy.
  const ms = date.getTime();
  return {
    seconds: Math.floor(ms / 1000),
    nanos: (ms % 1000) * 1_000_000,
  } as unknown as Date;
}

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
    createdAt: toTimestamp(user.createdAt),
  };
}

export function mapProtoDeviceTypeToDomain(
  deviceType: DeviceType,
): DomainDeviceType | null {
  switch (deviceType) {
    case DeviceType.DEVICE_TYPE_MOBILE:
      return DomainDeviceType.MOBILE;
    case DeviceType.DEVICE_TYPE_DESKTOP:
      return DomainDeviceType.DESKTOP;
    case DeviceType.DEVICE_TYPE_TABLET:
      return DomainDeviceType.TABLET;
    case DeviceType.DEVICE_TYPE_WEB:
      return DomainDeviceType.WEB;
    default:
      return null;
  }
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
    createdAt: toTimestamp(session.createdAt),
    lastActivityAt: toTimestamp(session.lastActivityAt),
    expiresAt: toTimestamp(session.expiresAt),
    isCurrent,
  };
}
