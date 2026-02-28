import { Catch, Logger } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { status } from '@grpc/grpc-js';
import { MicroserviceException } from '../exceptions/microservice.exception';

export interface GrpcErrorResponse {
  code: status;
  message: string;
}

@Catch()
export class GrpcExceptionFilter extends BaseRpcExceptionFilter {
  private readonly logger = new Logger(GrpcExceptionFilter.name);

  override catch(exception: unknown): Observable<never> {
    if (exception instanceof MicroserviceException) {
      const details = exception.getDetails();

      if (Object.keys(details).length > 0) {
        this.logger.warn('MicroserviceException', {
          message: exception.message,
          code: exception.getCode(),
          details,
        });
      }

      return throwError((): GrpcErrorResponse => ({
        code: exception.getCode(),
        message: exception.message,
      }));
    }

    this.logger.error('Unhandled exception', {
      error: exception instanceof Error ? exception.message : exception,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    return throwError((): GrpcErrorResponse => ({
      code: status.INTERNAL,
      message: 'Internal server error',
    }));
  }
}
