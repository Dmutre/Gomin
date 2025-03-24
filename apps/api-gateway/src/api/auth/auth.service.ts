import { MessageDTO, QRCodeResponse, RefreshSessionResponse, TwoFaLoginDTO, UserLoginDTO, UserMessagePattern, UserRegistrationDTO, UserResponse, USERS_SERVICE, UserSessionsResponse, Verify2FADTO } from "@gomin/common";
import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Observable } from "rxjs";

@Injectable()
export class AuthService {
  constructor(
    @Inject(USERS_SERVICE) private readonly userClient: ClientProxy,
  ) {}

  register(data: UserRegistrationDTO): Observable<MessageDTO> {
    return this.userClient.send(UserMessagePattern.REGISTER_USER, data);
  }

  requestEmailVerification(email: string): Observable<MessageDTO> {
    return this.userClient.send(UserMessagePattern.REQUEST_EMAIL_VERIFICATION, { email });
  }

  verifyEmail(token: string): Observable<MessageDTO> {
    return this.userClient.send(UserMessagePattern.VERIFY_EMAIL, { token });
  }

  login(data: UserLoginDTO): Observable<RefreshSessionResponse> {
    return this.userClient.send(UserMessagePattern.LOGIN, data);
  }

  logout(sessionId: string): Observable<MessageDTO> {
    return this.userClient.send(UserMessagePattern.LOGOUT, { sessionId });
  }

  getUserSessions(userId: string): Observable<UserSessionsResponse[]> {
    return this.userClient.send(UserMessagePattern.GET_USER_SESSIONS, { userId });
  }

  terminateSession(sessionId: string): Observable<MessageDTO> {
    return this.userClient.send(UserMessagePattern.TERMINATE_SESSION, { sessionId });
  }

  refreshSession(token: string): Observable<RefreshSessionResponse> {
    return this.userClient.send(UserMessagePattern.REFRESH_SESSION, { token });
  }

  enable2FA(userId: string): Observable<QRCodeResponse> {
    return this.userClient.send(UserMessagePattern.ENABLE_2FA, { userId });
  }

  verify2FA(data: Verify2FADTO): Observable<RefreshSessionResponse> {
    return this.userClient.send(UserMessagePattern.VERIFY_2FA, data);
  }

  loginWith2FA(data: TwoFaLoginDTO): Observable<RefreshSessionResponse> {
    return this.userClient.send(UserMessagePattern.LOGIN_WITH_2FA, data);
  }

  getCurrentUser(token: string): Observable<UserResponse> {
    return this.userClient.send(UserMessagePattern.GET_CURRENT_USER, { token });
  }
}
