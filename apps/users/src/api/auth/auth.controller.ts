import { UserMessagePattern, UserRegistrationDTO } from "@gomin/common";
import { Body, Controller } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { AuthService } from "./auth.service";

@Controller('auth')
export class AuthController {

  constructor(private readonly authService: AuthService) {}

  @MessagePattern(UserMessagePattern.REGISTER_NEW_USER)
  register(@Body() data: UserRegistrationDTO) {
    return this.authService.registrate(data);
  }
}