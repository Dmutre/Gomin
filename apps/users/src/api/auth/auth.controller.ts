import { UserMessagePattern } from "@gomin/common";
import { Controller } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { AuthService } from "./auth.service";

@Controller('auth')
export class AuthController {

  constructor(private readonly authService: AuthService) {}

  @MessagePattern(UserMessagePattern.TEST)
  test() {
    return this.authService.test();
  }
}