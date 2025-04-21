import { ConfigSmith, LoggerModule } from '@gomin/common';
import { NotificationClientModule, PermissionClientModule } from '@gomin/utils';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './api/chats/chat.module';

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
  ],
})
export class AppModule {}
