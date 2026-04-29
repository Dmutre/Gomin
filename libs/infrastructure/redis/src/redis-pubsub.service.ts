import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
  Inject,
} from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT, REDIS_PREFIX } from './redis.tokens';

export type PubSubEventType =
  | 'message:new'
  | 'message:updated'
  | 'message:deleted'
  | 'message:reaction_added'
  | 'message:reaction_removed'
  | 'message:read_receipt'
  | 'typing:start'
  | 'typing:stop'
  | 'chat:new'
  | 'chat:member_added'
  | 'chat:member_removed'
  | 'chat:deleted'
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

  constructor(
    @Inject(REDIS_CLIENT) private readonly publisher: Redis,
    @Inject(REDIS_PREFIX) private readonly prefix: string,
  ) {}

  onModuleInit() {
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

  private prefixed(channel: string): string {
    return `${this.prefix}:${channel}`;
  }

  async subscribe(channel: string, handler: PubSubHandler): Promise<void> {
    const key = this.prefixed(channel);
    if (!this.handlers.has(key)) {
      this.handlers.set(key, new Set());
      await this.subscriber.subscribe(key);
    }
    this.handlers.get(key)!.add(handler);
  }

  async unsubscribe(channel: string, handler: PubSubHandler): Promise<void> {
    const key = this.prefixed(channel);
    const handlers = this.handlers.get(key);
    if (!handlers) return;
    handlers.delete(handler);
    if (handlers.size === 0) {
      this.handlers.delete(key);
      await this.subscriber.unsubscribe(key);
    }
  }

  async publish(channel: string, message: PubSubMessage): Promise<void> {
    await this.publisher.publish(
      this.prefixed(channel),
      JSON.stringify(message),
    );
  }

  chatChannel(chatId: string): string {
    return `chat:${chatId}`;
  }

  userChannel(userId: string): string {
    return `user:${userId}`;
  }
}
