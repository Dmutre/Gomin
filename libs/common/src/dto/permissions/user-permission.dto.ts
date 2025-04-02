import { EntityType } from "@my-prisma/client/permissions";

export class UserPermissionDTO {
  id: string;
  permissionId: string;
  userId: string;
  entityId?: string;
  entityType: EntityType;
  allowed?: boolean = true;
}
