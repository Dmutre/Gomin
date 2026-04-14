import { Module } from '@nestjs/common';
import { CommunicationGrpcController } from './communication.grpc.controller';

@Module({
  controllers: [CommunicationGrpcController],
})
export class CommunicationModule {}
