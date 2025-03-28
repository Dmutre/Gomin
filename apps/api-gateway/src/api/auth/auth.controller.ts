import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { EmailDTO, LoginDTO, MessageDTO, QRCodeResponse, RefreshSessionResponse, RegistrationDTO, SessionDTO, SessionIdDTO, TokenDTO, TwoFaUserLoginDTO, UserResponse, UserVerify2FADTO, Verify2FADTO } from "@gomin/common";
import { IPLocationService } from "@gomin/utils";
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { Observable } from "rxjs";
import { Request } from "express";
import { AuthGuard } from "../../libs/security/auth.guard";
import { ClsService } from "nestjs-cls";

@Controller('auth')
export class AuthController {

  constructor(
    private readonly authService: AuthService,
    private readonly cls: ClsService
  ) {}

  private extractSessionData(request: Request): SessionDTO {
    const userAgent = request.headers['user-agent'] || 'Unknown';
    const ipAddress = request.ip;
    const deviceName = request.headers['device-name'] as string || 'Unknown';
    const lookup = IPLocationService.getUserLocation(ipAddress);
    const location = lookup ? `${lookup.city}, ${lookup.region}, ${lookup.country}` : null;
    return { userAgent, ipAddress, deviceName, location };
  }

  @Post()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiOkResponse({ type: MessageDTO })
  register(@Body() data: RegistrationDTO, @Req() request: Request): Observable<MessageDTO> {
    const session = this.extractSessionData(request);
    return this.authService.register({ ...data, session });
  }

  @Post('/email/request-verification')
  @ApiOperation({ summary: 'Request email verification' })
  @ApiOkResponse({ type: MessageDTO })
  requestEmailVerification(@Body() { email }: EmailDTO): Observable<MessageDTO> {
    return this.authService.requestEmailVerification(email);
  }

  @Post('/email/verify')
  @ApiOperation({ summary: 'Verify email' })
  @ApiOkResponse({ type: MessageDTO })
  verifyEmail(@Body() { token }: TokenDTO): Observable<MessageDTO> {
    return this.authService.verifyEmail(token);
  }

  @Post('/login')
  @ApiOperation({ summary: 'Login' })
  @ApiOkResponse({ type: RefreshSessionResponse })
  login(@Body() data: LoginDTO, @Req() request: Request): Observable<RefreshSessionResponse> {
    const session = this.extractSessionData(request);
    return this.authService.login({ ...data, session });
  }

  @UseGuards(AuthGuard)
  @Post('/logout')
  @ApiOperation({ summary: 'Logout' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: MessageDTO })
  logout(@Body() { sessionId }: SessionIdDTO): Observable<MessageDTO> {
    return this.authService.logout(sessionId);
  }

  @UseGuards(AuthGuard)
  @Get('/me')
  @ApiOperation({ summary: 'Get current user' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserResponse })
  getCurrentUser(): UserResponse {
    return this.cls.get('user');
  }

  @UseGuards(AuthGuard)
  @Get('/sessions')
  @ApiOperation({ summary: 'Get all user sessions' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: [SessionDTO] })
  getUserSessions(): Observable<SessionDTO[]> {
    return this.authService.getUserSessions(this.getCurrentUser().id);
  }

  @UseGuards(AuthGuard)
  @Delete('/sessions/terminate/:sessionId')
  @ApiOperation({ summary: 'Terminate a user session' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: MessageDTO })
  terminateSession(@Param('sessionId') sessionId: string): Observable<MessageDTO> {
    return this.authService.terminateSession(sessionId);
  }

  @Post('/sessions/refresh')
  @ApiOperation({ summary: 'Refresh a user session' })
  @ApiOkResponse({ type: RefreshSessionResponse })
  refreshSession(@Body() { token }: TokenDTO): Observable<RefreshSessionResponse> {
    return this.authService.refreshSession(token);
  }

  @UseGuards(AuthGuard)
  @Post('/2fa/enable')
  @ApiOperation({ summary: 'Enable 2FA' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: QRCodeResponse })
  enable2FA(): Observable<QRCodeResponse> {
    return this.authService.enable2FA(this.getCurrentUser().id);
  }

  @UseGuards(AuthGuard)
  @Post('/2fa/verify')
  @ApiOperation({ summary: 'Verify 2FA' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: RefreshSessionResponse })
  verify2FA(@Body() data: UserVerify2FADTO): Observable<RefreshSessionResponse> {
    const user = this.getCurrentUser();
    return this.authService.verify2FA({ ...data, userId: user.id });
  }

  @Post('/2fa/login')
  @ApiOperation({ summary: 'Login with 2FA' })
  @ApiOkResponse({ type: RefreshSessionResponse })
  loginWith2FA(@Body() data: TwoFaUserLoginDTO, @Req() request: Request): Observable<RefreshSessionResponse> {
    const session = this.extractSessionData(request);
    return this.authService.loginWith2FA({ ...data, session });
  }
}
