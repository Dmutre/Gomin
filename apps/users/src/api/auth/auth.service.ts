import { MessageDTO, MicroserviceException, NotificationClient, SessionDTO, UserLoginDTO, UserRegistrationDTO } from "@gomin/common";
import { HttpStatus, Injectable } from "@nestjs/common";
import { UserRepository } from "../../lib/database/repositories/user.repository";
import { UserSettingsRepository } from "../../lib/database/repositories/user-setting.repository";
import { hashPassword, validatePassword } from "@gomin/utils";
import { Session, User } from "@my-prisma/client/users";
import { Tokens } from "../../lib/interfaces/tokens.interface";
import { JwtTokenService } from "../../lib/security/jwt/jwt-token.service";
import { TokenService } from "../tokens/token.service";
import { UserFull } from "@gomin/users-db";
import { SessionService } from "../../lib/security/sessions/session.service";

@Injectable()
export class AuthService {
  private readonly 
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userSettingsRepository: UserSettingsRepository,
    private readonly sessionService: SessionService,
    private readonly jwtService: JwtTokenService,
    private readonly notificationClient: NotificationClient,
    private readonly tokenService: TokenService,
  ) {}

  async registrate(data: UserRegistrationDTO): Promise<MessageDTO> {
    await this.checkIfUserExists(data.email);
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
    const refreshToken = await this.jwtService.generateToken({ sub: user.id }, { expiresIn: `${user.userSetting.sessionDuration}d` });
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

  async notifyUserAboutNewSession(userId: string, session: SessionDTO) {
    const user = await this.userRepository.findUserById(userId);
    await this.notificationClient.sendNewSessionNotification(user.email, {
      deviceName: session.deviceName,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      timestamp: new Date().toISOString(),
    });
  }
  

  private async checkIfUserExists(email: string) {
    const user = await this.userRepository.findUserByEmail(email);
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

  async requestEmailVerification(email: string): Promise<MessageDTO> {
    const user = await this.userRepository.findUserByEmail(email);
    if (user.emailVerified) {
      throw new MicroserviceException('Email is already verified', HttpStatus.BAD_REQUEST);
    }
    const token = await this.tokenService.generateEmailVerificationToken(user.id);
    await this.notificationClient.sendEmailVerificationEmail(email, token);

    return { message: 'Email has been sent' };
  }

  async verifyEmailToken(token: string): Promise<MessageDTO> {
    const userId = await this.tokenService.verifyOrThrowEmailToken(token);
    await this.userRepository.updateUser(userId, { emailVerified: true });
    return { message: 'Email has been verified' };
  }

  private async checkUserCredentials(email: string, password: string): Promise<UserFull> {
    const user = await this.userRepository.findUserByEmail(email);
    if (!user) {
      throw new MicroserviceException('User with such email does not exist', HttpStatus.BAD_REQUEST);
    } else if (!user.emailVerified) {
      throw new MicroserviceException('Email is not verified', HttpStatus.BAD_REQUEST);
    }
    await this.comparePasswordsAndThrow(password, user.password);
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

  async login(data: UserLoginDTO) {
    const user = await this.checkUserCredentials(data.email, data.password);
    const session = await this.getOrCreateUserSession(user.id, data.session);
    const tokens = await this.generateTokens(user);
    await this.sessionService.updateSessionToken(session.id, tokens.refreshToken);
    return tokens;
  }
}
