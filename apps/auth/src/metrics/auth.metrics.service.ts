import { Injectable } from '@nestjs/common';
import { MetricsService } from '@gomin/metrics';
import type { Counter } from '@opentelemetry/api';

@Injectable()
export class AuthMetricsService {
  private readonly usersRegistered: Counter;
  private readonly usersLoggedIn: Counter;
  private readonly sessionsCreated: Counter;
  private readonly sessionsTerminated: Counter;
  private readonly passwordChanged: Counter;

  constructor(private readonly metrics: MetricsService) {
    this.usersRegistered = metrics.counter('gomin.auth.users.registered', {
      description: 'Total number of successful user registrations',
    });
    this.usersLoggedIn = metrics.counter('gomin.auth.users.logged_in', {
      description: 'Total number of successful logins',
    });
    this.sessionsCreated = metrics.counter('gomin.auth.sessions.created', {
      description: 'Total number of sessions created',
    });
    this.sessionsTerminated = metrics.counter('gomin.auth.sessions.terminated', {
      description: 'Total number of sessions terminated',
    });
    this.passwordChanged = metrics.counter('gomin.auth.password.changed', {
      description: 'Total number of password change operations',
    });
  }

  recordRegistration(): void {
    this.usersRegistered.add(1);
  }

  recordLogin(): void {
    this.usersLoggedIn.add(1);
  }

  recordSessionCreated(): void {
    this.sessionsCreated.add(1);
  }

  recordSessionsTerminated(count = 1): void {
    this.sessionsTerminated.add(count);
  }

  recordPasswordChanged(): void {
    this.passwordChanged.add(1);
  }
}
