import { Injectable } from '@nestjs/common';
import { Metadata } from '@grpc/grpc-js';
import { MicroserviceIdentityAuthService } from '@gomin/service-identity';
import { CommunicationGrpcClient } from '@gomin/grpc';
import type { StoreSenderKeysDto } from './dto/store-sender-keys.dto';

@Injectable()
export class SenderKeysService {
  constructor(
    private readonly communicationClient: CommunicationGrpcClient,
    private readonly identityAuthService: MicroserviceIdentityAuthService,
  ) {}

  private async buildMetadata(): Promise<Metadata> {
    const token = await this.identityAuthService.getAccessToken();
    const metadata = new Metadata();
    if (token) metadata.add('authorization', `Bearer ${token}`);
    return metadata;
  }

  async storeSenderKeys(chatId: string, dto: StoreSenderKeysDto) {
    const metadata = await this.buildMetadata();
    return this.communicationClient.storeSenderKeys(
      { chatId, keys: dto.keys },
      metadata,
    );
  }

  async getChatSenderKeys(chatId: string, userId: string) {
    const metadata = await this.buildMetadata();
    return this.communicationClient.getChatSenderKeys(
      { chatId, userId },
      metadata,
    );
  }

  async getSenderKey(chatId: string, senderId: string, recipientId: string) {
    const metadata = await this.buildMetadata();
    return this.communicationClient.getSenderKey(
      { chatId, senderId, recipientId },
      metadata,
    );
  }
}
