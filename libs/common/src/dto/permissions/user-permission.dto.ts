import { EntityType } from "@my-prisma/client/permissions";

export class UserPermissionDTO {
  permissionId: string;
  userId: string;
  entityId?: string;
  entityType: EntityType;
  allowed?: boolean = true;
}
