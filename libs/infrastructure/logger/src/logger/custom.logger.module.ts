import { Module } from "@nestjs/common";
import { LoggerModule } from "nestjs-pino";

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: 'info',
        base: {
          service: 'auth-service',
        },
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.token',
          ],
          censor: '[REDACTED]',
        },
        serializers: {
          req(req: { method: any; url: any; }) {
            return {
              method: req.method,
              url: req.url,
            };
          },
          res(res: { statusCode: any; }) {
            return {
              statusCode: res.statusCode,
            };
          },
        },
      },
    }),
  ]
})
export class CustomLoggerModule {}
