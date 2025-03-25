import { MessageDTO, MicroserviceException, NotificationClient, SessionDTO, UserLoginDTO, UserRegistrationDTO, UserSessionsResponse, Tokens, RefreshSessionResponse, UserResponse, Verify2FADTO, UserIdDTO, QRCodeResponse, TwoFaLoginDTO } from "@gomin/common";
import { HttpStatus, Injectable } from "@nestjs/common";
import { UserRepository } from "../../lib/database/repositories/user.repository";
import { UserSettingsRepository } from "../../lib/database/repositories/user-setting.repository";
import { hashPassword, QRCodeUtils, validatePassword } from "@gomin/utils";
import { Session, User } from "@my-prisma/client/users";
import { JwtTokenService } from "../../lib/security/jwt/jwt-token.service";
import { TokenService } from "../../lib/tokens/token.service";
import { UserFull } from "@gomin/users-db";
import { SessionService } from "../../lib/security/sessions/session.service";
import { plainToInstance } from "class-transformer";

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userSettingsRepository: UserSettingsRepository,
    private readonly sessionService: SessionService,
    private readonly jwtService: JwtTokenService,
    private readonly notificationClient: NotificationClient,
    private readonly tokenService: TokenService,
  ) {}

  async registrate(data: UserRegistrationDTO): Promise<MessageDTO> {
    await this.checkIfUserExists(data.email, data.username);
    data.password = await this.hashPassword(data.password);
    await this.createUser(data);
    return { message: 'User has been successfully registered' };
  }

  private async createUser(data: UserRegistrationDTO): Promise<User> {
    const { session, ...userData } = data;
    const user = await this.userRepository.createUser(userData);
    await this.createUserSettings(user.id);
    await this.createUserSession(session, user.id);
    return user;
  }

  private async generateTokens(user: UserFull): Promise<Tokens> {
    const accessToken = await this.jwtService.generateToken({ sub: user.id });
    const refreshToken = await this.tokenService.generateSessionToken();
    return { accessToken, refreshToken };
  }

  private async createUserSession(
    session: SessionDTO,
    userId: string,
    notifyUser = false,
  ): Promise<Session> {
    const createdSession = await this.sessionService.createSession(session, userId);
  
    if (notifyUser) {
      await this.notifyUserAboutNewSession(userId, session);
    }
  
    return createdSession;
  }

  private async notifyUserAboutNewSession(userId: string, session: SessionDTO) {
    const user = await this.userRepository.findUserById(userId);
    await this.notificationClient.sendNewSessionNotification({
      email: user.email,
      data: {
        deviceName: session.deviceName,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        timestamp: new Date().toISOString(),
      },
    });
  }
  

  private async checkIfUserExists(email: string, username?: string) {
    const user = await this.userRepository.findUser({ where: { OR: [{ email }, { username }] } });
    if (user) {
      throw new MicroserviceException('User with such email already exists', HttpStatus.BAD_REQUEST);
    }
  }

  private async createUserSettings(userId: string) {
    return this.userSettingsRepository.createSettings({ userId });
  }

  private async hashPassword(password: string): Promise<string> {
    return await hashPassword(password);
  }

  private async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return await validatePassword(password, hashedPassword);
  }

  private async comparePasswordsAndThrow(password: string, hashedPassword: string): Promise<boolean> {
    const isValid = await this.comparePasswords(password, hashedPassword);
    if (!isValid) {
      throw new MicroserviceException('Invalid password', HttpStatus.BAD_REQUEST);
    }
    return isValid;
  }

  private async verifyUserExistance(email: string): Promise<UserFull> {
    const user = await this.userRepository.findUserByEmail(email);
    if (!user) {
      throw new MicroserviceException('User with such email does not exist', HttpStatus.BAD_REQUEST);
    }
    return user;
  }

  async requestEmailVerification(email: string): Promise<MessageDTO> {
    const user = await this.verifyUserExistance(email);
    if (user.emailVerified) {
      throw new MicroserviceException('Email is already verified', HttpStatus.BAD_REQUEST);
    }
    const token = await this.tokenService.generateEmailVerificationToken(user.id);
    await this.notificationClient.sendEmailVerificationEmail({ email, code: token });

    return { message: 'Email has been sent' };
  }

  async verifyEmailToken(token: string): Promise<MessageDTO> {
    const userId = await this.tokenService.verifyOrThrowEmailToken(token);
    await this.userRepository.updateUser(userId, { emailVerified: true });
    return { message: 'Email has been verified' };
  }

  private async checkUserCredentials(email: string, password: string, enforceNo2FA = false): Promise<UserFull> {
    const user = await this.userRepository.findUserByEmail(email);
    if (!user) {
      throw new MicroserviceException('User with such email does not exist', HttpStatus.BAD_REQUEST);
    }
    if (!user.emailVerified) {
      throw new MicroserviceException('Email is not verified', HttpStatus.BAD_REQUEST);
    }
    await this.comparePasswordsAndThrow(password, user.password);
    if (enforceNo2FA && user.twoFaEnabled) {
      throw new MicroserviceException('Two factor authentication is enabled', HttpStatus.FORBIDDEN);
    }
    return user;
  }  

  private async getOrCreateUserSession(userId: string, sessionData: SessionDTO): Promise<Session> {
    const existingSession = await this.findExistingUserSession(userId, sessionData);
    return existingSession
      ? this.updateExistingSession(existingSession, sessionData)
      : this.createUserSession(sessionData, userId, true);
  }
  
  private async findExistingUserSession(userId: string, sessionData: SessionDTO): Promise<Session | null> {
    return this.sessionService.findSessionByDeviceNameAndUserAgent(userId, sessionData.deviceName, sessionData.userAgent);
  }
  
  private async updateExistingSession(existingSession: Session, sessionData: SessionDTO): Promise<Session> {
    if (existingSession.ipAddress !== sessionData.ipAddress) {
      return this.sessionService.updateSession(existingSession.id, {
        ipAddress: sessionData.ipAddress
      });
    }
    return existingSession;
  }

  private async createSessionAndTokens(user: UserFull, sessionData: SessionDTO): Promise<RefreshSessionResponse> {
    const session = await this.getOrCreateUserSession(user.id, sessionData);
    return this.finalizeSessionAndTokens(user, session);
  }
  
  private async finalizeSessionAndTokens(user: UserFull, session: Session): Promise<RefreshSessionResponse> {
    const tokens = await this.generateTokens(user);
    await this.sessionService.updateSessionToken(session.id, tokens.refreshToken);
    return { tokens, sessionId: session.id };
  }

  async login(data: UserLoginDTO): Promise<RefreshSessionResponse> {
    const user = await this.checkUserCredentials(data.email, data.password, true);
    return this.createSessionAndTokens(user, data.session);
  }

  async logout(sessionId: string): Promise<MessageDTO> {
    await this.sessionService.deleteSession(sessionId);
    return { message: 'Logged out successfully' };
  }

  async getUserSessions(userId: string): Promise<UserSessionsResponse[]> {
    const sessions = await this.sessionService.findSessionsByUser(userId);
    return plainToInstance(UserSessionsResponse, sessions, { excludeExtraneousValues: true });
  }

  async terminateSession(sessionId: string): Promise<MessageDTO> {
    await this.sessionService.deleteSession(sessionId);
    return { message: 'Session has been terminated' };
  }

  private async validateRefreshToken(token: string): Promise<UserFull> {
    const userId = await this.tokenService.verifyOrThrowSessionToken(token);
    const user = await this.userRepository.findUserById(userId);
    return user;
  }

  private async validateSession(token: string, userId: string): Promise<Session> {
    const session = await this.sessionService.findSessionByTokenAndUserId(token, userId);
    if (!session) {
      throw new MicroserviceException('Session not found', HttpStatus.UNAUTHORIZED);
    }
    return session;
  }

  async refreshSession(token: string): Promise<RefreshSessionResponse> {
    const user = await this.validateRefreshToken(token);
    const session = await this.validateSession(token, user.id);
    return this.finalizeSessionAndTokens(user, session);
  }

  private async enable2FAForUser(userId: string) {
    await this.userRepository.updateUser(userId, { twoFaEnabled: true });
  }

  async getCurrentUser(token: string): Promise<UserResponse> {
    const payload = await this.jwtService.verifyToken(token);
    const user = await this.userRepository.findUserById(payload.sub);
    return plainToInstance(UserResponse, user, { excludeExtraneousValues: true });
  }

  async enable2FA({ userId }: UserIdDTO): Promise<QRCodeResponse> {
    const user = await this.userRepository.findUserById(userId);
    if (user.twoFaEnabled) {
      throw new MicroserviceException('Two factor authentication is already enabled', HttpStatus.BAD_REQUEST);
    }
    const otpauthUrl = await this.tokenService.generate2FAToken(userId);
    return { qrcode: await QRCodeUtils.generateQRCodeFromUrl(otpauthUrl) };
  }

  async verify2FA({ userId, code, sessionId }: Verify2FADTO): Promise<RefreshSessionResponse> {
    const user = await this.userRepository.findUserById(userId);
    const session = await this.sessionService.findOrThrowSessionById(sessionId);
    await this.tokenService.verify2FAToken(user.id, code);
    await this.enable2FAForUser(user.id);
    return await this.finalizeSessionAndTokens(user, session);
  }

  async loginWith2FA(data: TwoFaLoginDTO): Promise<RefreshSessionResponse> {
    const user = await this.checkUserCredentials(data.email, data.password, false);
    await this.tokenService.verify2FAToken(user.id, data.code);
    return await this.createSessionAndTokens(user, data.session);
  }
}
