import { UserMessagePattern, UserRegistrationDTO, EmailDTO, TokenDTO, UserLoginDTO, SessionIdDTO, UserIdDTO, Verify2FADTO, TwoFaLoginDTO } from "@gomin/common";
import { Body, Controller } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { AuthService } from "./auth.service";

@Controller('auth')
export class AuthController {

  constructor(private readonly authService: AuthService) {}

  @MessagePattern(UserMessagePattern.REGISTER_USER)
  register(@Body() data: UserRegistrationDTO) {
    return this.authService.registrate(data);
  }

  @MessagePattern(UserMessagePattern.REQUEST_EMAIL_VERIFICATION)
  requestEmailVerification(@Body() { email }: EmailDTO) {
    return this.authService.requestEmailVerification(email);
  }

  @MessagePattern(UserMessagePattern.VERIFY_EMAIL)
  verifyEmail(@Body() { token }: TokenDTO) {
    return this.authService.verifyEmailToken(token);
  }

  @MessagePattern(UserMessagePattern.LOGIN)
  login(@Body() data: UserLoginDTO) {
    return this.authService.login(data);
  }

  @MessagePattern(UserMessagePattern.LOGOUT)
  logout(@Body() { sessionId }: SessionIdDTO) {
    return this.authService.logout(sessionId);
  }

  @MessagePattern(UserMessagePattern.GET_USER_SESSIONS)
  getUserSessions(@Body() { userId }: UserIdDTO) {
    return this.authService.getUserSessions(userId);
  }

  @MessagePattern(UserMessagePattern.TERMINATE_SESSION)
  terminateSession(@Body() { sessionId }: SessionIdDTO) {
    return this.authService.terminateSession(sessionId);
  }

  @MessagePattern(UserMessagePattern.REFRESH_SESSION)
  refreshSession(@Body() { token }: TokenDTO) {
    return this.authService.refreshSession(token);
  }

  @MessagePattern(UserMessagePattern.ENABLE_2FA)
  enable2FA(@Body() data: UserIdDTO) {
    return this.authService.enable2FA(data);
  }

  @MessagePattern(UserMessagePattern.VERIFY_2FA)
  verify2FA(@Body() data: Verify2FADTO) {
    return this.authService.verify2FA(data);
  }

  @MessagePattern(UserMessagePattern.LOGIN_WITH_2FA)
  loginWith2FA(@Body() data: TwoFaLoginDTO) {
    return this.authService.loginWith2FA(data);
  }

  @MessagePattern(UserMessagePattern.GET_CURRENT_USER)
  getCurrentUser(@Body() { token }: TokenDTO) {
    return this.authService.getCurrentUser(token);
  }
}