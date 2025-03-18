import { UserMessagePattern } from "@gomin/common";
import { Body, Controller } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { AuthService } from "./auth.service";
import { TestDTO } from "./dto/test.dto";

@Controller('auth')
export class AuthController {

  constructor(private readonly authService: AuthService) {}

  @MessagePattern(UserMessagePattern.TEST)
  test(@Body() data: TestDTO) {
    return this.authService.test();
  }
}