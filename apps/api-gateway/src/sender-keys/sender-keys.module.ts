import { Module } from '@nestjs/common';
import { SenderKeysController } from './sender-keys.controller';
import { SenderKeysService } from './sender-keys.service';

@Module({
  controllers: [SenderKeysController],
  providers: [SenderKeysService],
  exports: [SenderKeysService],
})
export class SenderKeysModule {}
