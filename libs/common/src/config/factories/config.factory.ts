import * as dotenv from 'dotenv';
import { Config } from '../interfaces/config.interface';

dotenv.config();

export function ConfigSmith(): Config {
  return {
    server: {
      port: Number(process.env['PORT']) || 3000,
      host: process.env['HOST'] || 'localhost',
    },
    auth: process.env['JWT_SECRET']
      ? {
          secret: process.env['JWT_SECRET'],
          accessTtl: process.env['JWT_ACCESS_TTL'] || '1h',
          refreshTtl: process.env['JWT_REFRESH_TTL'] || '24h',
        }
      : undefined,
  };
}
