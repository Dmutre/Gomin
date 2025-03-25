import { Module } from "@nestjs/common";
import { EmailChannel } from "./email.channel";

@Module({
  providers: [EmailChannel],
  exports: [EmailChannel],
})
export class EmailModule {}
