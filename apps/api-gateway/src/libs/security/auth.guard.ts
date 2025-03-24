import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../../api/auth/auth.service";
import { UserResponse } from "@gomin/common";
import { ClsService } from "nestjs-cls";
import { firstValueFrom } from "rxjs";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly cls: ClsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) throw new UnauthorizedException('No token provided');

    const user: UserResponse = await firstValueFrom(this.authService.getCurrentUser(token));
    this.cls.set('user', user);
    
    return true;
  }
}