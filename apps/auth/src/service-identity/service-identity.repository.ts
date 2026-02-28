import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectConnection } from 'nest-knexjs';
import type { ServiceIdentityDomainModel } from './types/service-identity.domain.model';
import type { ServiceIdentityDb } from './types/service-identity.db';
import type { Permission } from '@gomin/service-identity';

interface ServiceIdentityRow extends ServiceIdentityDb {
  permissions: Permission[];
}

@Injectable()
export class ServiceIdentityRepository {
  private readonly table = 'ServiceIdentities';
  private readonly permissionsTable = 'Permissions';
  private readonly servicePermissionsTable = 'ServicePermissions';

  constructor(@InjectConnection() private readonly knex: Knex) {}

  async findByServiceNameWithPermissions(
    serviceName: string,
  ): Promise<ServiceIdentityDomainModel | null> {
    const row = await this.knex<ServiceIdentityDb>(this.table)
      .where('ServiceIdentities.serviceName', serviceName)
      .where('ServiceIdentities.isActive', true)
      .leftJoin(
        this.servicePermissionsTable,
        'ServicePermissions.serviceIdentityId',
        'ServiceIdentities.id',
      )
      .leftJoin(
        this.permissionsTable,
        'Permissions.id',
        'ServicePermissions.permissionId',
      )
      .first(
        'ServiceIdentities.id',
        'ServiceIdentities.serviceName',
        'ServiceIdentities.secretHash',
        'ServiceIdentities.isActive',
        'ServiceIdentities.createdAt',
        this.knex.raw(
          `
          COALESCE(
            json_agg(??.name) FILTER (WHERE ??.name IS NOT NULL),
            '[]'
          ) as permissions
        `,
          [this.permissionsTable, this.permissionsTable],
        ),
      )
      .groupBy('ServiceIdentities.id');

    return row ? this.toDomain(row as ServiceIdentityRow) : null;
  }

  private toDomain(row: ServiceIdentityRow): ServiceIdentityDomainModel {
    return {
      id: row.id,
      serviceName: row.serviceName,
      secretHash: row.secretHash,
      isActive: row.isActive,
      createdAt: row.createdAt,
      permissions: row.permissions,
    };
  }
}
