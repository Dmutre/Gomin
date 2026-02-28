import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

export class MicroserviceException extends RpcException {
  private details: Record<string, unknown> = {};

  constructor(message: string, code: status) {
    super({
      message,
      code,
    });
  }

  setDetails(details: Record<string, unknown>): void {
    this.details = details;
  }

  getDetails(): Record<string, unknown> {
    return this.details;
  }

  getCode(): status {
    return (this.getError() as { code: status }).code;
  }
}
