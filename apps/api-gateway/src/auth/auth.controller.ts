import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SessionGuard } from './guards/session.guard';
import {
  CurrentUser,
  CurrentUser as CurrentUserType,
} from './decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  TerminateSessionDto,
  TerminateAllOtherSessionsDto,
} from './dto/terminate-session.dto';
import { SwaggerApiTags } from '../common/swagger/api-tags';

@ApiTags(SwaggerApiTags.AUTH)
@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  @ApiOperation({ summary: 'Register a new user with E2EE keys' })
  @ApiResponse({
    status: 201,
    description: 'User registered, session token returned',
  })
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    const ipAddress = (req.headers['x-real-ip'] as string) ?? req.ip ?? '0.0.0.0';
    return this.authService.register(dto, ipAddress);
  }

  @Post('/login')
  @ApiOperation({
    summary: 'Login and receive session token + encrypted E2EE private key',
  })
  @ApiResponse({ status: 200 })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    const ipAddress = (req.headers['x-real-ip'] as string) ?? req.ip ?? '0.0.0.0';
    return this.authService.login(dto, ipAddress);
  }

  @Post('/logout')
  @UseGuards(SessionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invalidate current session' })
  logout(@CurrentUser() user: CurrentUserType) {
    return this.authService.logout(user.sessionToken);
  }

  @Get('/sessions')
  @UseGuards(SessionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all active sessions for the current user' })
  getSessions(@CurrentUser() user: CurrentUserType) {
    return this.authService.getActiveSessions(user.sessionToken);
  }

  @Delete('/sessions')
  @UseGuards(SessionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Terminate all sessions except the current one' })
  terminateAllOtherSessions(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: TerminateAllOtherSessionsDto,
  ) {
    return this.authService.terminateAllOtherSessions(user.sessionToken, dto);
  }

  @Delete('/sessions/:targetSessionToken')
  @UseGuards(SessionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Terminate a specific session' })
  terminateSession(
    @CurrentUser() user: CurrentUserType,
    @Param('targetSessionToken') targetSessionToken: string,
    @Body()
    dto: Omit<TerminateSessionDto, 'targetSessionToken'> & { password: string },
  ) {
    return this.authService.terminateSession(user.sessionToken, {
      targetSessionToken,
      password: dto.password,
    });
  }

  @Post('/change-password')
  @UseGuards(SessionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password and rotate E2EE keys' })
  changePassword(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.sessionToken, dto);
  }

  @Get('/users/:userId/public-key')
  @UseGuards(SessionGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Get another user's RSA public key for E2EE sender key distribution",
  })
  getUserPublicKey(
    @CurrentUser() user: CurrentUserType,
    @Param('userId') userId: string,
  ) {
    return this.authService.getUserPublicKey(user.sessionToken, userId);
  }
}
