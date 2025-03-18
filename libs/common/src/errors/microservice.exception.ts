import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export class MicroserviceException extends RpcException {
  constructor(message: string | string[], status: HttpStatus) {
    super({ message, status });
  }
}