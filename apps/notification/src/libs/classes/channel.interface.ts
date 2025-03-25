export abstract class NotificationChannel<TPayload = any> {
  abstract send(message: TPayload): Promise<void>
}
