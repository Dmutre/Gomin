import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PERMISSIONS_KEY } from '../decorators/permission.decorator'
import { MicroserviceException } from '@gomin/common'
import { PermissionClient } from '@gomin/utils';
import { firstValueFrom } from 'rxjs';
import { ChatRepository } from '../../database/repositories/chat.repository';

@Injectable()
export class ChatPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionClient: PermissionClient,
    private readonly chatRepo: ChatRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true
    }

    const rpcContext = context.switchToRpc()
    const data = rpcContext.getData()
    const executorId: string = data.executorId;
    const chatId: string = data.chatId;

    if (!executorId || !chatId) {
      throw new MicroserviceException('Action performance error', HttpStatus.FORBIDDEN);
    }

    const chat = await this.chatRepo.findOrThrow(chatId);

    if (chat.ownerId === executorId) {
      return true;
    }

    const isAllowedToPerform: boolean = await firstValueFrom(await this.permissionClient.checkUserPermissions({
      codes: requiredPermissions,
      userId: executorId,
      entityId: chatId,
    }))

    if (!isAllowedToPerform) {
      throw new MicroserviceException('Action performance error', HttpStatus.FORBIDDEN);
    }

    return true
  }
}
