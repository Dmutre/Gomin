import { SetMetadata } from '@nestjs/common'

export const PERMISSIONS_KEY = 'permissions'

export const PermissionsMetadata = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions)
