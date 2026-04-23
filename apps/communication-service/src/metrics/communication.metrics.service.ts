import { Injectable } from '@nestjs/common';
import { MetricsService } from '@gomin/metrics';
import type { Counter } from '@gomin/metrics';

@Injectable()
export class CommunicationMetricsService {
  private readonly chatsCreated: Counter;
  private readonly membersAdded: Counter;
  private readonly membersRemoved: Counter;
  private readonly messagesSent: Counter;
  private readonly messagesEdited: Counter;
  private readonly messagesDeleted: Counter;
  private readonly reactionsAdded: Counter;

  constructor(private readonly metrics: MetricsService) {
    this.chatsCreated = metrics.counter('gomin.communication.chats.created', {
      description: 'Total number of chats created',
    });
    this.membersAdded = metrics.counter('gomin.communication.members.added', {
      description: 'Total number of chat members added',
    });
    this.membersRemoved = metrics.counter('gomin.communication.members.removed', {
      description: 'Total number of chat members removed',
    });
    this.messagesSent = metrics.counter('gomin.communication.messages.sent', {
      description: 'Total number of messages sent',
    });
    this.messagesEdited = metrics.counter('gomin.communication.messages.edited', {
      description: 'Total number of messages edited',
    });
    this.messagesDeleted = metrics.counter('gomin.communication.messages.deleted', {
      description: 'Total number of messages deleted',
    });
    this.reactionsAdded = metrics.counter('gomin.communication.reactions.added', {
      description: 'Total number of reactions added to messages',
    });
  }

  recordChatCreated(type: string): void {
    this.chatsCreated.add(1, { 'chat.type': type });
  }

  recordMembersAdded(count = 1): void {
    this.membersAdded.add(count);
  }

  recordMemberRemoved(): void {
    this.membersRemoved.add(1);
  }

  recordMessageSent(): void {
    this.messagesSent.add(1);
  }

  recordMessageEdited(): void {
    this.messagesEdited.add(1);
  }

  recordMessageDeleted(): void {
    this.messagesDeleted.add(1);
  }

  recordReactionAdded(): void {
    this.reactionsAdded.add(1);
  }
}
