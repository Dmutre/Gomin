import { Module } from "@nestjs/common";
import { PushChannel } from "./push.channel";

@Module({
  providers: [PushChannel],
  exports: [PushChannel],
})
export class PushModule {}
