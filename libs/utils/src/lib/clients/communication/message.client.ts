import { Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { Observable } from 'rxjs'
import {
  COMMUNICATION_SERVICE,
  CommunicationMessagePattern,
  SendMessageDTO,
  UpdateMessageDTO,
  MessageActionDTO,
  ReadMessagesDTO,
} from '@gomin/common'
import { Message } from '@my-prisma/client/communication'

@Injectable()
export class MessageClient {
  constructor(@Inject(COMMUNICATION_SERVICE) private readonly client: ClientProxy) {}

  sendMessage(data: SendMessageDTO): Observable<Message> {
    return this.client.send(CommunicationMessagePattern.SEND_MESSAGE, data)
  }

  updateMessage(data: UpdateMessageDTO): Observable<Message> {
    return this.client.send(CommunicationMessagePattern.UPDATE_MESSAGE, data)
  }

  deleteMessage(data: MessageActionDTO): Observable<{ message: string }> {
    return this.client.send(CommunicationMessagePattern.DELETE_MESSAGE, data)
  }

  deleteUserMessage(data: MessageActionDTO): Observable<{ message: string }> {
    return this.client.send(CommunicationMessagePattern.DELETE_OTHER_MESSAGES, data)
  }

  readMessages(data: ReadMessagesDTO): Observable<{ message: string }> {
    return this.client.send(CommunicationMessagePattern.READ_MESSAGES, data)
  }
}
