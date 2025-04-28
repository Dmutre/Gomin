import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common'
import { MicroserviceException } from '@gomin/common'
import { MessageRepository } from '../../database/repositories/message.repository';

@Injectable()
export class ExecutorOwnMessageGuard implements CanActivate {
  constructor(
    private readonly messageRepo: MessageRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {

    const rpcContext = context.switchToRpc()
    const data = rpcContext.getData()
    const executorId: string = data.executorId;
    const messageId: string = data.messageId;

    if (!executorId || !messageId) {
      throw new MicroserviceException('Action performance error', HttpStatus.FORBIDDEN);
    }

    const message = await this.messageRepo.findOrThrow(messageId);

    if (!message) {
      throw new MicroserviceException('Message not found', HttpStatus.NOT_FOUND);
    } else if (message.senderId !== executorId) {
      throw new MicroserviceException('You doesn\'t own the message', HttpStatus.FORBIDDEN);
    }

    return true
  }
}
