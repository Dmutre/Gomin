import { Injectable } from "@nestjs/common";
import { NotificationChannel } from "../../classes/channel.interface";
import { PushPayload } from "@gomin/common";

@Injectable()
export class PushChannel extends NotificationChannel<PushPayload> {
  async send(payload: PushPayload): Promise<void> {
    console.log(payload);
  }
}

