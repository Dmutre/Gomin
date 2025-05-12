import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CommunicationGateway } from "./communication.gateway";
import { LoggerModule } from "@gomin/common";

@Module({
  imports: [AuthModule, LoggerModule],
  providers: [CommunicationGateway]
})
export class GatewayModule {}
