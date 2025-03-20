import { Inject, Injectable } from "@nestjs/common";
import { NOTIFICATIONS_SERVICE } from "../config";
import { ClientProxy } from "@nestjs/microservices";
import { NotificationMessagePatterns } from "../message-patterns";
import { NewSessionNotificationDTO } from "../dto/sessions/new-session-notification.dto";

@Injectable()
export class NotificationClient {

  constructor(@Inject(NOTIFICATIONS_SERVICE) private readonly client: ClientProxy) {}

  async sendEmailVerificationEmail(email: string, token: string) {
    return this.client.emit(NotificationMessagePatterns.SEND_VERIFICATION_EMAIL, { email, token });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    return this.client.emit(NotificationMessagePatterns.SEND_PASSWORD_RESET_EMAIL, { email, token });
  }

  async sendNewSessionNotification(email: string, data: NewSessionNotificationDTO) {
    return this.client.emit(NotificationMessagePatterns.SEND_NEW_SESSION_NOTIFICATION, { email, data });
  }
}