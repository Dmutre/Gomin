import { Injectable } from "@nestjs/common";
import { NotificationChannel } from "../../classes/channel.interface";
import { EmailPayload } from "@gomin/common";

@Injectable()
export class EmailChannel extends NotificationChannel<EmailPayload> {
  async send(payload: EmailPayload): Promise<void> {
    console.log(payload);
  }
}