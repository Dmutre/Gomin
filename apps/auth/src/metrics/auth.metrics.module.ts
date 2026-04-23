import { Module } from '@nestjs/common';
import { AuthMetricsService } from './auth.metrics.service';

@Module({
  providers: [AuthMetricsService],
  exports: [AuthMetricsService],
})
export class AuthMetricsModule {}
