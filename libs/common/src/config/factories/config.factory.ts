import * as dotenv from 'dotenv';
import { Config } from '../interfaces/config.interface';
import { Transport } from '@nestjs/microservices';

dotenv.config();

export function ConfigSmith(): Config {
  return {
    server: {
      port: Number(process.env['PORT'] || 3000),
      host: process.env['HOST'] ?? '0.0.0.0',
      cors: {
        origin: process.env['CORS_ORIGIN'] ?? '*',
        methods: process.env['CORS_METHODS'] ?? 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
      }
    },
    auth: process.env['JWT_SECRET']
      ? {
          secret: process.env['JWT_SECRET'] ?? 'secret',
          accessTtl: process.env['JWT_ACCESS_TTL'] ?? '1h',
        }
      : undefined,
    microservices: {
      usersService: {
        transport: Transport.TCP,
        options: {
          port: Number(process.env['USERS_PORT']),
          host: process.env['USERS_HOST'] ?? '0.0.0.0',
        }
      },
      communicationService: {
        transport: Transport.TCP,
        options: {
          port: Number(process.env['COMMUNICATION_PORT']),
          host: process.env['COMMUNICATION_HOST'] ?? '0.0.0.0',
        }
      },
      notificationsService: {
        transport: Transport.TCP,
        options: {
          port: Number(process.env['NOTIFICATIONS_PORT']),
          host: process.env['NOTIFICATIONS_HOST'] ?? '0.0.0.0',
        }
      }
    }
  };
}
