import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class GrpcLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('gRPC');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const rpc = context.getArgByIndex(2);
    const method: string =
      rpc?.call?.handler?.path ?? context.getHandler().name;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(`${method} ${Date.now() - start}ms`);
        },
        error: () => {
          // errors are already logged by GrpcExceptionFilter
        },
      }),
    );
  }
}
