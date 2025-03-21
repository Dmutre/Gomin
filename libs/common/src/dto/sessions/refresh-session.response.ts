import { Tokens } from "../../interfaces";

export interface RefreshSessionResponse {
  tokens: Tokens;
  sessionId: string;
} 