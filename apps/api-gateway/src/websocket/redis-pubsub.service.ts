import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
  Inject,
} from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

export type PubSubEventType =
  | 'message:new'
  | 'message:updated'
  | 'message:deleted'
  | 'message:reaction_added'
  | 'message:reaction_removed'
  | 'message:read_receipt'
  | 'typing:start'
  | 'typing:stop'
  | 'chat:member_added'
  | 'chat:member_removed'
  | 'presence:update'
  | 'sender_key:received';

export interface PubSubMessage {
  event: PubSubEventType;
  chatId?: string;
  userId?: string;
  data: unknown;
}

type PubSubHandler = (message: PubSubMessage) => void;

@Injectable()
export class RedisPubSubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisPubSubService.name);
  private subscriber!: Redis;
  private readonly handlers = new Map<string, Set<PubSubHandler>>();

  constructor(@Inject(REDIS_CLIENT) private readonly publisher: Redis) {}

  onModuleInit() {
    // Duplicate the connection for subscribing (Redis sub connection cannot publish)
    this.subscriber = this.publisher.duplicate();

    this.subscriber.on('message', (channel: string, rawMessage: string) => {
      try {
        const message = JSON.parse(rawMessage) as PubSubMessage;
        const handlers = this.handlers.get(channel);
        if (handlers) {
          for (const handler of handlers) {
            handler(message);
          }
        }
      } catch (err) {
        this.logger.error('Failed to parse pub/sub message', err);
      }
    });
  }

  async onModuleDestroy() {
    await this.subscriber.quit();
  }

  async subscribe(channel: string, handler: PubSubHandler): Promise<void> {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
      await this.subscriber.subscribe(channel);
    }
    this.handlers.get(channel).add(handler);
  }

  async unsubscribe(channel: string, handler: PubSubHandler): Promise<void> {
    const handlers = this.handlers.get(channel);
    if (!handlers) return;
    handlers.delete(handler);
    if (handlers.size === 0) {
      this.handlers.delete(channel);
      await this.subscriber.unsubscribe(channel);
    }
  }

  async publish(channel: string, message: PubSubMessage): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify(message));
  }

  chatChannel(chatId: string): string {
    return `chat:${chatId}`;
  }

  userChannel(userId: string): string {
    return `user:${userId}`;
  }
}
