import axios from 'axios';
import type {
  Chat,
  ChatMember,
  ChatType,
  LoginDto,
  LoginResponse,
  MemberRole,
  Message,
  MessagePayload,
  MessageType,
  RegisterDto,
  SenderKey,
  Session,
  User,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach auth token
apiClient.interceptors.request.use((config) => {
  // Import lazily to avoid circular deps
  const raw = localStorage.getItem('auth-storage');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const token = parsed?.state?.sessionToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore
    }
  }
  return config;
});

// Response interceptor: on 401 clear auth and redirect
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// ── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (dto: RegisterDto): Promise<{ user: User }> =>
    apiClient.post('/auth/register', dto).then((r) => r.data),

  login: (dto: LoginDto): Promise<LoginResponse> =>
    apiClient.post('/auth/login', dto).then((r) => r.data),

  logout: (): Promise<void> =>
    apiClient.post('/auth/logout').then(() => undefined),

  getSessions: (): Promise<{ sessions: Session[] }> =>
    apiClient.get('/auth/sessions').then((r) => r.data),

  terminateSession: (
    targetSessionToken: string,
    password: string,
  ): Promise<void> =>
    apiClient
      .delete(`/auth/sessions/${targetSessionToken}`, { data: { password } })
      .then(() => undefined),

  terminateAllOtherSessions: (password: string): Promise<void> =>
    apiClient
      .delete('/auth/sessions', { data: { password } })
      .then(() => undefined),

  getUserPublicKey: (userId: string): Promise<{ publicKey: string }> =>
    apiClient.get(`/auth/users/${userId}/public-key`).then((r) => r.data),

  changePassword: (dto: {
    currentPassword: string;
    newPassword: string;
    e2eeKeys: {
      publicKey: string;
      encryptedPrivateKey: string;
      encryptionSalt: string;
      encryptionIv: string;
      encryptionAuthTag: string;
    };
  }): Promise<void> =>
    apiClient.post('/auth/change-password', dto).then(() => undefined),
};

// ── Chats ─────────────────────────────────────────────────────────────────────

export const chatsApi = {
  getChats: (): Promise<{ chats: Chat[] }> =>
    apiClient.get('/chats').then((r) => r.data),

  createChat: (dto: {
    type: ChatType;
    name?: string;
    memberUsernames: string[];
  }): Promise<{ chat: Chat }> =>
    apiClient.post('/chats', dto).then((r) => r.data),

  getChat: (chatId: string): Promise<{ chat: Chat }> =>
    apiClient.get(`/chats/${chatId}`).then((r) => r.data),

  addMember: (
    chatId: string,
    userId: string,
    role: MemberRole,
  ): Promise<{ member: ChatMember }> =>
    apiClient
      .post(`/chats/${chatId}/members`, { userId, role })
      .then((r) => r.data),

  removeMember: (chatId: string, userId: string): Promise<void> =>
    apiClient
      .delete(`/chats/${chatId}/members/${userId}`)
      .then(() => undefined),

  updateMemberRole: (
    chatId: string,
    userId: string,
    role: MemberRole,
  ): Promise<void> =>
    apiClient
      .patch(`/chats/${chatId}/members/${userId}/role`, { role })
      .then(() => undefined),
};

// ── Messages ─────────────────────────────────────────────────────────────────

export const messagesApi = {
  getMessages: (
    chatId: string,
    params?: { limit?: number; beforeMessageId?: string },
  ): Promise<{ messages: Message[] }> =>
    apiClient.get(`/chats/${chatId}/messages`, { params }).then((r) => r.data),

  sendMessage: (
    chatId: string,
    payload: MessagePayload,
    type: MessageType = 'TEXT',
  ): Promise<{ message: Message }> =>
    apiClient
      .post(`/chats/${chatId}/messages`, { payload, type })
      .then((r) => r.data),

  editMessage: (
    chatId: string,
    messageId: string,
    payload: MessagePayload,
  ): Promise<{ message: Message }> =>
    apiClient
      .patch(`/chats/${chatId}/messages/${messageId}`, { payload })
      .then((r) => r.data),

  deleteMessage: (chatId: string, messageId: string): Promise<void> =>
    apiClient
      .delete(`/chats/${chatId}/messages/${messageId}`)
      .then(() => undefined),

  addReaction: (
    chatId: string,
    messageId: string,
    emoji: string,
  ): Promise<void> =>
    apiClient
      .post(`/chats/${chatId}/messages/${messageId}/reactions`, { emoji })
      .then(() => undefined),

  removeReaction: (
    chatId: string,
    messageId: string,
    emoji: string,
  ): Promise<void> =>
    apiClient
      .delete(`/chats/${chatId}/messages/${messageId}/reactions/${emoji}`)
      .then(() => undefined),

  markRead: (chatId: string, upToMessageId: string): Promise<void> =>
    apiClient
      .post(`/chats/${chatId}/read`, { upToMessageId })
      .then(() => undefined),
};

// ── Sender Keys ───────────────────────────────────────────────────────────────

export const senderKeysApi = {
  distributeSenderKeys: (
    chatId: string,
    keys: Array<{
      senderId: string;
      recipientId: string;
      encryptedSenderKey: string;
      keyVersion: number;
    }>,
  ): Promise<void> =>
    apiClient
      .post(`/chats/${chatId}/sender-keys`, { keys })
      .then(() => undefined),

  getSenderKeys: (chatId: string): Promise<{ keys: SenderKey[] }> =>
    apiClient.get(`/chats/${chatId}/sender-keys`).then((r) => r.data),

  getSenderKeyBySender: (
    chatId: string,
    senderId: string,
  ): Promise<{ key: SenderKey }> =>
    apiClient
      .get(`/chats/${chatId}/sender-keys/${senderId}`)
      .then((r) => r.data),
};
