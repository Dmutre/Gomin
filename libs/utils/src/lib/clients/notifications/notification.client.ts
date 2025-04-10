import { Inject, Injectable } from "@nestjs/common";
import { NOTIFICATIONS_SERVICE } from "@gomin/common";
import { ClientProxy } from "@nestjs/microservices";
import { NotificationMessagePatterns } from "@gomin/common";
import { EmailVerificationDTO, NewSessionEmailNotificationDTO, PasswordResetDTO, PushNotificationDTO } from "@gomin/common";

@Injectable()
export class NotificationClient {

  constructor(@Inject(NOTIFICATIONS_SERVICE) private readonly client: ClientProxy) {}

  async sendEmailVerificationEmail(payload: EmailVerificationDTO) {
    return this.client.emit(NotificationMessagePatterns.SEND_VERIFICATION_EMAIL, payload);
  }

  async sendPasswordResetEmail(payload: PasswordResetDTO) {
    return this.client.emit(NotificationMessagePatterns.SEND_PASSWORD_RESET_EMAIL, payload);
  }

  async sendNewSessionNotification(payload: NewSessionEmailNotificationDTO) {
    return this.client.emit(NotificationMessagePatterns.SEND_NEW_SESSION_NOTIFICATION, payload);
  }

  async sendPushNotification(payload: PushNotificationDTO) {
    return this.client.emit(NotificationMessagePatterns.SEND_PUSH_NOTIFICATION, payload);
  }
}