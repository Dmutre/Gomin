import { UserMessagePattern, USERS_SERVICE } from "@gomin/common";
import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";

@Injectable()
export class AuthService {
  constructor(
    @Inject(USERS_SERVICE) private readonly userClient: ClientProxy,
  ) {}

  test () {
    return this.userClient.send(UserMessagePattern.TEST, {});
  }
}