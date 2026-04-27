import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Settings,
  Monitor,
  LogOut,
  Plus,
  Hash,
  Users,
} from 'lucide-react';
import gominLogo from '../assets/gomin-logo.png';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { useCryptoStore } from '../store/crypto.store';
import { toast } from '../store/toast.store';
import { authApi, chatsApi, normalizeChat } from '../lib/api';
import {
  disconnectSocket,
  getSocket,
  initSocket,
  subscribeManyChats,
} from '../lib/socket';
import type { Chat, Message } from '../types';
import { cn, formatDate, truncate } from '../lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ReauthOverlay } from './ReauthOverlay';

function ChatTypeIcon({ type }: { type: Chat['type'] }) {
  if (type === 'DIRECT')
    return <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />;
  if (type === 'CHANNEL')
    return <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />;
  return <Users className="h-4 w-4 shrink-0 text-muted-foreground" />;
}

function getChatDisplayName(chat: Chat, currentUserId?: string): string {
  if (chat.type === 'DIRECT' && currentUserId) {
    const other = chat.members.find((m) => m.userId !== currentUserId);
    return other?.username ?? other?.userId ?? 'Unknown';
  }
  return (
    chat.name ?? chat.members.map((m) => m.username ?? m.userId).join(', ')
  );
}

function ChatListItem({ chat }: { chat: Chat }) {
  const { user } = useAuthStore();
  const displayName = getChatDisplayName(chat, user?.id);

  return (
    <NavLink
      to={`/chats/${chat.id}`}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors group',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground',
        )
      }
    >
      <ChatTypeIcon type={chat.type} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="text-sm font-medium text-foreground truncate">
            {truncate(displayName, 22)}
          </span>
          {chat.lastMessage && (
            <span className="text-[10px] text-muted-foreground shrink-0">
              {formatDate(chat.lastMessage.createdAt)}
            </span>
          )}
        </div>
        {chat.lastMessage && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {chat.lastMessage.decryptedContent ?? '🔒 Encrypted'}
          </p>
        )}
      </div>
      {(chat.unreadCount ?? 0) > 0 && (
        <Badge
          variant="default"
          className="shrink-0 min-w-[18px] h-[18px] text-[10px] px-1 justify-center"
        >
          {chat.unreadCount}
        </Badge>
      )}
    </NavLink>
  );
}

export function Layout() {
  const { user, sessionToken, privateKey, logout } = useAuthStore();
  const clearCrypto = useCryptoStore((s) => s.clearAll);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [socketReady, setSocketReady] = useState(false);

  const currentChatId = location.pathname.startsWith('/chats/')
    ? location.pathname.split('/chats/')[1]
    : undefined;

  // Inline refs — updated on every render so handlers always read the latest value
  // without needing to be in effect deps (avoids re-registration on every navigation)
  const currentChatIdRef = useRef<string | undefined>(currentChatId);
  currentChatIdRef.current = currentChatId;
  const userRef = useRef(user);
  userRef.current = user;

  // Reset unread count when entering a chat
  useEffect(() => {
    if (!currentChatId) return;
    queryClient.setQueryData<{ chats: Chat[] }>(['chats'], (old) => {
      if (!old) return old;
      return {
        chats: old.chats.map((c) =>
          c.id === currentChatId ? { ...c, unreadCount: 0 } : c,
        ),
      };
    });
  }, [currentChatId, queryClient]);

  // Init socket when we have both token and private key
  useEffect(() => {
    if (!sessionToken) return;
    const existing = getSocket();
    if (!existing?.connected) {
      initSocket(sessionToken);
    }
    setSocketReady(true);
  }, [sessionToken]);

  const { data: chatsData } = useQuery({
    queryKey: ['chats'],
    queryFn: () => chatsApi.getChats(),
    enabled: !!sessionToken && !!privateKey,
  });

  // Subscribe to all chats for WS events; re-subscribe on reconnect
  useEffect(() => {
    if (!socketReady || !chatsData?.chats?.length) return;
    const socket = getSocket();
    if (!socket) return;

    const chatIds = chatsData.chats.map((c) => c.id);
    const resubscribe = () => subscribeManyChats(chatIds);
    resubscribe();
    socket.on('connect', resubscribe);
    return () => {
      socket.off('connect', resubscribe);
    };
  }, [socketReady, chatsData?.chats]);

  // Real-time: new chat created → add to list + subscribe
  useEffect(() => {
    if (!socketReady) return;
    const socket = getSocket();
    if (!socket) return;

    const onChatNew = (data: { chat: Chat }) => {
      const raw = data?.chat;
      if (!raw) return;
      const chat = normalizeChat(raw);
      queryClient.setQueryData<{ chats: Chat[] }>(['chats'], (old) => {
        if (!old) return { chats: [chat] };
        if (old.chats.some((c) => c.id === chat.id)) return old;
        return { chats: [chat, ...old.chats] };
      });
      subscribeManyChats([chat.id]);
    };

    socket.on('chat:new', onChatNew);
    return () => {
      socket.off('chat:new', onChatNew);
    };
  }, [socketReady, queryClient]);

  // Real-time: new message → update lastMessage in sidebar
  useEffect(() => {
    if (!socketReady) return;
    const socket = getSocket();
    if (!socket) return;

    const onMessageNew = (data: { message: Message }) => {
      const message = data?.message;
      if (!message) return;
      const isCurrentChat = message.chatId === currentChatIdRef.current;
      queryClient.setQueryData<{ chats: Chat[] }>(['chats'], (old) => {
        if (!old) return old;
        return {
          chats: old.chats.map((c) =>
            c.id === message.chatId
              ? {
                  ...c,
                  lastMessage: message,
                  unreadCount: isCurrentChat
                    ? (c.unreadCount ?? 0)
                    : (c.unreadCount ?? 0) + 1,
                }
              : c,
          ),
        };
      });
      if (!isCurrentChat) {
        const cached = queryClient.getQueryData<{ chats: Chat[] }>(['chats']);
        const chat = cached?.chats.find((c) => c.id === message.chatId);
        const chatName = chat ? getChatDisplayName(chat, userRef.current?.id) : 'New message';
        const sender = message.senderUsername ? `${message.senderUsername}: ` : '';
        const preview = (message.decryptedContent ?? '🔒 Encrypted').slice(0, 50);
        toast.info(`${chatName} — ${sender}${preview}`);
      }
    };

    socket.on('message:new', onMessageNew);
    return () => {
      socket.off('message:new', onMessageNew);
    };
  }, [socketReady, queryClient]);

  // Presence ping interval
  useEffect(() => {
    if (!socketReady) return;
    const socket = getSocket();
    if (!socket) return;
    const interval = setInterval(() => socket.emit('presence:ping', {}), 30000);
    return () => clearInterval(interval);
  }, [socketReady]);

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      // swallow
    }
    disconnectSocket();
    clearCrypto();
    logout();
    navigate('/login');
  }

  const needsReauth = !!sessionToken && !privateKey;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-border">
        {/* Logo */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <img src={gominLogo} alt="Gomin" className="h-8 w-8 object-contain" />
          <div>
            <h1 className="text-sm font-bold text-foreground">Gomin</h1>
            <p className="text-[10px] text-muted-foreground">E2EE Messenger</p>
          </div>
        </div>

        {/* Chats list header */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Chats
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => navigate('/')}
            title="New chat"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Chat list */}
        <ScrollArea.Root className="flex-1 overflow-hidden">
          <ScrollArea.Viewport className="h-full px-2">
            <div className="flex flex-col gap-0.5 pb-4">
              {chatsData?.chats?.map((chat) => (
                <ChatListItem key={chat.id} chat={chat} />
              ))}
              {!chatsData?.chats?.length && (
                <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                  No chats yet
                </p>
              )}
            </div>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            orientation="vertical"
            className="flex w-1.5 touch-none select-none p-0.5"
          >
            <ScrollArea.Thumb className="relative flex-1 rounded-full bg-border" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>

        {/* Bottom nav */}
        <div className="border-t border-border p-2">
          <div className="flex flex-col gap-0.5">
            <NavLink
              to="/sessions"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                )
              }
            >
              <Monitor className="h-4 w-4" />
              Sessions
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                )
              }
            >
              <Settings className="h-4 w-4" />
              Settings
            </NavLink>
          </div>

          {/* User info + logout */}
          <div className="mt-2 flex items-center gap-2 rounded-md px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
              {user?.username?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {user?.username}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>

      {/* Re-auth overlay */}
      {needsReauth && <ReauthOverlay />}
    </div>
  );
}
