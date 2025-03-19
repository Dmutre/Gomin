import { MessageDTO, MicroserviceException, SessionDTO, UserRegistrationDTO } from "@gomin/common";
import { HttpStatus, Injectable } from "@nestjs/common";
import { UserRepository } from "../../lib/database/repositories/user.repository";
import { UserSettingsRepository } from "../../lib/database/repositories/user-setting.repository";
import { TokenRepository } from "../../lib/database/repositories/token.repository";
import { SessionRepository } from "../../lib/database/repositories/session.repository";
import { hashPassword, validatePassword } from "@gomin/utils";
import { Session, User } from "@prisma/client/users";
import { Tokens } from "../../lib/interfaces/tokens.interface";
import { JwtTokenService } from "../../lib/security/jwt-token.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly userSettingsRepository: UserSettingsRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly jwtService: JwtTokenService,
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

  private async generateTokens(userId: string): Promise<Tokens> {
    const user = await this.userRepository.findOrThrow(userId);
    const accessToken = await this.jwtService.generateToken({ sub: user.id });
    const refreshToken = await this.jwtService.generateToken({ sub: user.id }, { expiresIn: `${user.userSetting.sessionDuration}d` });
    return { accessToken, refreshToken };
  }

  private async createUserSession(session: SessionDTO, userId: string): Promise<Session> {
    return this.sessionRepository.createSession({ ...session, userId });
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

    return { message: 'Email has been sent' };
  }
}