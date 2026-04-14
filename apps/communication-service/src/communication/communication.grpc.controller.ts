import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type { PingRequest, PingResponse } from '@gomin/grpc';

@Controller()
export class CommunicationGrpcController {
  @GrpcMethod('CommunicationService', 'Ping')
  ping(_request: PingRequest): PingResponse {
    void _request;
    return { message: 'pong' };
  }
}
