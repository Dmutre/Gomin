import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';

@Catch()
export class GatewayExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    this.logger.error(exception);

    const { status, messages } = this.getStatusAndMessages(exception);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      messages,
    });
  }

  private getStatusAndMessages(exception: any): { status: number; messages: string[] } {
    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        messages: this.normalizeMessages(exception.getResponse()),
      };
    }

    if (exception.message && exception.status) {
      return {
        status: exception.status,
        messages: [exception.message],
      };
    }

    if (typeof exception === 'object' && exception?.error?.status && exception?.error?.message) {
      return {
        status: exception.error.status,
        messages: [exception.error.message],
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      messages: ['Internal server error'],
    };
  }

  private normalizeMessages(response: any): string[] {
    if (typeof response === 'string') {
      return [response];
    }
    if (typeof response === 'object' && response?.message) {
      return Array.isArray(response.message) ? response.message : [response.message];
    }
    return ['Unknown error'];
  }
}
