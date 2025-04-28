import { ConfigSmith, LoggerModule } from '@gomin/common';
import { NotificationClientModule, PermissionClientModule } from '@gomin/utils';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './api/chats/chat.module';
import { MessageModule } from './api/messages/message.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [ConfigSmith],
    }),
    LoggerModule,
    NotificationClientModule,
    PermissionClientModule,
    NotificationClientModule,
    ChatModule,
    MessageModule,
  ],
})
export class AppModule {}
