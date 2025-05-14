import { Injectable } from "@nestjs/common";
import { MessageClient } from "@gomin/utils";
import { MessageActionDTO, ReadMessagesDTO, SendMessageDTO, UpdateMessageDTO } from "@gomin/common";
import { firstValueFrom } from "rxjs";

@Injectable()
export class MessageService {

  constructor(private readonly messageClient: MessageClient) {}

  sendMessage(data: SendMessageDTO) {
    return firstValueFrom(this.messageClient.sendMessage(data));
  }

  updateMessage(data: UpdateMessageDTO) {
    return firstValueFrom(this.messageClient.updateMessage(data));
  }

  deleteMessage(data: MessageActionDTO) {
    return firstValueFrom(this.messageClient.deleteMessage(data));
  }

  deleteUserMessage(data: MessageActionDTO) {
    return firstValueFrom(this.messageClient.deleteUserMessage(data));
  }

  readMessages(data: ReadMessagesDTO) {
    return firstValueFrom(this.messageClient.readMessages(data));
  }
}