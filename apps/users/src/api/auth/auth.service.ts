import { MicroserviceException } from "@gomin/common";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AuthService {

  test () {
    return { message: 'Hello message from test' };
  }
}