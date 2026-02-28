import { Module } from '@nestjs/common';
import { LocalIdentityGuard } from './local-identity.guard';
import { LocalIdentityService } from './local-identity.service';

@Module({
  providers: [LocalIdentityService, LocalIdentityGuard],
  exports: [LocalIdentityService, LocalIdentityGuard],
})
export class LocalIdentityModule {}
