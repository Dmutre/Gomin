import { Catch, Logger } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { status } from '@grpc/grpc-js';
import { MicroserviceException } from '../exceptions/microservice.exception';

export interface GrpcErrorResponse {
  code: status;
  message: string;
}

// gRPC codes that map to 4xx HTTP — expected client errors, not server faults
const CLIENT_ERROR_CODES = new Set<status>([
  status.INVALID_ARGUMENT,
  status.FAILED_PRECONDITION,
  status.NOT_FOUND,
  status.ALREADY_EXISTS,
  status.PERMISSION_DENIED,
  status.UNAUTHENTICATED,
  status.RESOURCE_EXHAUSTED,
  status.UNIMPLEMENTED,
  status.OUT_OF_RANGE,
  status.ABORTED,
]);

@Catch()
export class GrpcExceptionFilter extends BaseRpcExceptionFilter {
  private readonly logger = new Logger(GrpcExceptionFilter.name);

  override catch(exception: unknown): Observable<never> {
    if (exception instanceof MicroserviceException) {
      const code = exception.getCode();
      const details = exception.getDetails();
      const meta = {
        message: exception.message,
        code,
        ...(Object.keys(details).length > 0 ? { details } : {}),
      };

      if (CLIENT_ERROR_CODES.has(code)) {
        this.logger.warn(exception.message, meta);
      } else {
        this.logger.error(exception.message, { ...meta, stack: exception.stack });
      }

      return throwError(
        (): GrpcErrorResponse => ({ code, message: exception.message }),
      );
    }

    this.logger.error('Unhandled exception', {
      error: exception instanceof Error ? exception.message : exception,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    return throwError(
      (): GrpcErrorResponse => ({
        code: status.INTERNAL,
        message: 'Internal server error',
      }),
    );
  }
}
