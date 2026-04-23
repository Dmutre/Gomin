import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';

let socket: Socket | null = null;

export function initSocket(token: string): Socket {
  if (socket?.connected) {
    socket.disconnect();
  }

  socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}

// ── Chat events ──────────────────────────────────────────────────────────────

export function subscribeToChat(chatId: string): void {
  socket?.emit('chat:subscribe', { chatId });
}

export function subscribeManyChats(chatIds: string[]): void {
  socket?.emit('chat:subscribe_many', { chatIds });
}

export function unsubscribeFromChat(chatId: string): void {
  socket?.emit('chat:unsubscribe', { chatId });
}

// ── Typing events ─────────────────────────────────────────────────────────────

export function emitTypingStart(chatId: string): void {
  socket?.emit('typing:start', { chatId });
}

export function emitTypingStop(chatId: string): void {
  socket?.emit('typing:stop', { chatId });
}

// ── Presence ─────────────────────────────────────────────────────────────────

export function pingPresence(): void {
  socket?.emit('presence:ping', {});
}

// ── Sender Key Distribution ──────────────────────────────────────────────────

export function distributeSenderKey(payload: {
  chatId: string;
  recipientId: string;
  encryptedSenderKey: string;
  keyVersion: number;
}): void {
  socket?.emit('sender_key:distribute', payload);
}
