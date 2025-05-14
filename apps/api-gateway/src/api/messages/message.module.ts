import { Module } from "@nestjs/common";
import { CommunicationClientModule } from "@gomin/utils";
import { MessageService } from "./message.service";

@Module({
  imports: [CommunicationClientModule],
  providers: [MessageService],
})
export class MessageModule {}