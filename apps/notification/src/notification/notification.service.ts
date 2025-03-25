import { Injectable } from "@nestjs/common";
import { EmailChannel } from "../libs/channels/mail/email.channel";
import { PushChannel } from "../libs/channels/push/push.channel";
import { EmailVerificationDTO, NewSessionEmailNotificationDTO, PasswordResetDTO, PushNotificationDTO } from "@gomin/common";

@Injectable()
export class NotificationService {
  constructor(
    private readonly emailChannel: EmailChannel,
    private readonly pushChannel: PushChannel,
  ) {}

  async sendEmailVerification({ email, code }: EmailVerificationDTO) {
    await this.emailChannel.send({
      from: 'noreply@gomin.com',
      to: email,
      subject: 'Verification Code',
      text: `Your verification code is ${code}`,
    });
  }

  async sendPasswordResetEmail({ email, code }: PasswordResetDTO) {
    await this.emailChannel.send({
      from: 'noreply@gomin.com',
      to: email,
      subject: 'Password Reset Code',
      text: `Your password reset code is ${code}`,
    });
  }

  async sendNewSessionNotification({ email, data }: NewSessionEmailNotificationDTO) {
    await this.emailChannel.send({
      from: 'noreply@gomin.com',
      to: email,
      subject: 'New Session',
      text: `You have a new session on your account IP: ${data.ipAddress}, User-Agent: ${data.userAgent}, Device: ${data.deviceName}, Timestamp: ${data.timestamp}`,
    });
  }

  async sendPushNotification({ token, title, body, data }: PushNotificationDTO) {
    await this.pushChannel.send({
      token,
      title,
      body,
      data,
    });
  }
}

