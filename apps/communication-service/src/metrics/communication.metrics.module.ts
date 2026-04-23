import { Module } from '@nestjs/common';
import { CommunicationMetricsService } from './communication.metrics.service';

@Module({
  providers: [CommunicationMetricsService],
  exports: [CommunicationMetricsService],
})
export class CommunicationMetricsModule {}
