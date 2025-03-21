import { Tokens } from '@gomin/common';

export interface RefreshSessionResponse {
  tokens: Tokens;
  sessionId: string;
} 