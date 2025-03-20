import { Injectable } from "@nestjs/common";
import { JwtPayload } from "../../interfaces/jwt-payload.interface";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";

@Injectable()
export class JwtTokenService {

  constructor(
    private readonly jwtService: JwtService,
  ) {}

  async generateToken(payload: JwtPayload, options?: JwtSignOptions): Promise<string> {
    return await this.jwtService.sign(payload, options);
  }
}