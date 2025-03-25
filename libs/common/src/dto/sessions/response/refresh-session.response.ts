import { ApiProperty } from "@nestjs/swagger";
import { Tokens } from "../../../interfaces";

export class RefreshSessionResponse {
  @ApiProperty({ example: { accessToken: 'accessToken', refreshToken: 'refreshToken' } })
  tokens: Tokens;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  sessionId: string;
} 