export interface PushPayload {
  token: string;
  title: string;
  body: string;
  data: Record<string, any>;
}
