import { ClientOptions } from '@nestjs/microservices'

export interface MicroservicesConfig {
  usersService: ClientOptions;
  communicationService: ClientOptions;
}