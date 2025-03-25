import { Catch, RpcExceptionFilter, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { MicroserviceException } from '../errors';
import { Logger } from 'nestjs-pino';

@Catch()
export class MicroserviceExceptionFilter implements RpcExceptionFilter<RpcException> {
  constructor(private readonly logger: Logger) {}

  catch(exception: any, host: ArgumentsHost): Observable<any> {
    this.logger.error(exception);
    
    if (exception instanceof MicroserviceException) {
      return throwError(() => exception);
    } else {
      const newException = new MicroserviceException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      return throwError(() => newException);
    }
  }
}