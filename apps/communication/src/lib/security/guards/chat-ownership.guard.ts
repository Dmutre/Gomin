import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { MicroserviceException } from '@gomin/common'
import { ChatRepository } from '../../database/repositories/chat.repository';

@Injectable()
export class ChatOwnershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly chatRepo: ChatRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {

    const rpcContext = context.switchToRpc()
    const data = rpcContext.getData()
    const executorId: string = data.executorId;
    const chatId: string = data.chatId;

    if (!executorId || !chatId) {
      throw new MicroserviceException('Action performance error', HttpStatus.FORBIDDEN);
    }

    const chat = await this.chatRepo.findOrThrow(chatId);

    if (executorId !== chat.ownerId) {
      throw new MicroserviceException('You are not the owner', HttpStatus.FORBIDDEN)
    }

    return true
  }
}
