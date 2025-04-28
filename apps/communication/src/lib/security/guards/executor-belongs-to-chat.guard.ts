import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common'
import { MicroserviceException } from '@gomin/common'
import { UserChatRepository } from '../../database/repositories/user-chat.repository';

@Injectable()
export class ExecutorBelongsToChatGuard implements CanActivate {
  constructor(
    private readonly userChatRepo: UserChatRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {

    const rpcContext = context.switchToRpc()
    const data = rpcContext.getData()
    const executorId: string = data.executorId;
    const chatId: string = data.chatId;

    if (!executorId || !chatId) {
      throw new MicroserviceException('Action performance error', HttpStatus.FORBIDDEN);
    }

    const chatUser = await this.userChatRepo.findUserChat(executorId, chatId);

    if (!chatUser) {
      throw new MicroserviceException('User doesn\'t belong to chat', HttpStatus.FORBIDDEN)
    }

    return true
  }
}
