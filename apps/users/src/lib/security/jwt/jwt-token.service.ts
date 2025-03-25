import { HttpStatus, Injectable } from "@nestjs/common";
import { JwtPayload } from "../../interfaces/jwt-payload.interface";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { MicroserviceException } from "@gomin/common";
@Injectable()
export class JwtTokenService {

  constructor(
    private readonly jwtService: JwtService,
  ) {}

  async generateToken(payload: JwtPayload, options?: JwtSignOptions): Promise<string> {
    return await this.jwtService.sign(payload, options);
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    return await this.jwtService.verifyAsync(token)
      .catch(() => {
        throw new MicroserviceException('Invalid token', HttpStatus.UNAUTHORIZED);
      });
  }
}