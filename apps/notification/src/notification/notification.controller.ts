import { Controller } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { EventPattern } from "@nestjs/microservices";
import { EmailVerificationDTO, NewSessionEmailNotificationDTO, NotificationMessagePatterns, PasswordResetDTO, PushNotificationDTO } from "@gomin/common";

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern(NotificationMessagePatterns.SEND_VERIFICATION_EMAIL)
  async sendVerificationEmail(payload: EmailVerificationDTO) {
    await this.notificationService.sendEmailVerification(payload);
  }

  @EventPattern(NotificationMessagePatterns.SEND_PASSWORD_RESET_EMAIL)
  async sendPasswordResetEmail(payload: PasswordResetDTO) {
    await this.notificationService.sendPasswordResetEmail(payload);
  }

  @EventPattern(NotificationMessagePatterns.SEND_NEW_SESSION_NOTIFICATION)
  async sendNewSessionNotification(payload: NewSessionEmailNotificationDTO) {
    await this.notificationService.sendNewSessionNotification(payload);
  }

  @EventPattern(NotificationMessagePatterns.SEND_PUSH_NOTIFICATION)
  async sendPushNotification(payload: PushNotificationDTO) {
    await this.notificationService.sendPushNotification(payload);
  }
}


