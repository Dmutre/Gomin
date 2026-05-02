import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  Pencil,
  Trash2,
  SmilePlus,
  UserPlus,
  Check,
  X,
  Hash,
  Users,
  MessageSquare,
  Reply,
} from 'lucide-react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as Tooltip from '@radix-ui/react-tooltip';
import { authApi, chatsApi, messagesApi, senderKeysApi } from '../lib/api';
import {
  decryptChainKey,
  decryptWithChainKey,
  encryptChainKeyForRecipient,
  encryptWithChainKey,
  generateChainKey,
} from '../lib/crypto';
import { useCryptoStore } from '../store/crypto.store';
import { useAuthStore } from '../store/auth.store';
import { toast } from '../store/toast.store';
import {
  emitTypingStart,
  emitTypingStop,
  getSocket,
} from '../lib/socket';
import { cn } from '../lib/utils';
import type { MemberRole, Message, MessageReaction, SenderKey } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Message bubble ────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  chatId: string;
  senderNames: Record<string, string>;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onRemoveReaction: (messageId: string, emoji: string) => void;
}

function MessageBubble({
  message,
  isOwn,
  chatId,
  senderNames,
  onEdit,
  onDelete,
  onReaction,
  onRemoveReaction,
}: MessageBubbleProps) {
  const [showEmoji, setShowEmoji] = useState(false);
  const { user } = useAuthStore();

  const content = message.decryptedContent;
  const isEncrypted = !content;
  const displayName =
    message.senderUsername ??
    senderNames[message.senderId] ??
    message.senderId.slice(0, 8);
  const createdAtDate = message.createdAt ? new Date(message.createdAt) : null;
  const timeStr =
    createdAtDate && !isNaN(createdAtDate.getTime())
      ? createdAtDate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

  return (
    <div
      className={cn(
        'flex group gap-2',
        isOwn ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {/* Avatar */}
      <div className="shrink-0 h-7 w-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold mt-1">
        {displayName[0]?.toUpperCase()}
      </div>

      <div
        className={cn('flex flex-col gap-1 max-w-[65%]', isOwn && 'items-end')}
      >
        {/* Sender + time */}
        <div
          className={cn(
            'flex items-center gap-2 px-1',
            isOwn && 'flex-row-reverse',
          )}
        >
          <span className="text-xs font-medium text-foreground">
            {displayName}
          </span>
          {timeStr && (
            <span className="text-[10px] text-muted-foreground">{timeStr}</span>
          )}
          {message.isEdited && (
            <span className="text-[10px] text-muted-foreground italic">
              (edited)
            </span>
          )}
        </div>

        {/* Reply preview */}
        {message.replyTo && (
          <div
            className={cn(
              'flex items-start gap-1 rounded-md border-l-2 border-primary/50 bg-muted/30 px-2 py-1 text-xs text-muted-foreground',
              isOwn && 'border-r-2 border-l-0',
            )}
          >
            <Reply className="h-3 w-3 shrink-0 mt-0.5" />
            <span className="truncate">
              {message.replyTo.decryptedContent ?? '🔒 Encrypted'}
            </span>
          </div>
        )}

        {/* Bubble */}
        <div className="relative">
          <div
            className={cn(
              'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
              isOwn
                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                : 'bg-card border border-border rounded-tl-sm',
              isEncrypted && 'italic text-muted-foreground',
            )}
          >
            {isEncrypted ? (
              <span className="flex items-center gap-1">
                <span>🔒</span> Encrypted — key not available
              </span>
            ) : (
              content
            )}
          </div>

          {/* Action buttons (visible on hover) */}
          <div
            className={cn(
              'absolute top-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity',
              isOwn ? 'right-full mr-1' : 'left-full ml-1',
            )}
          >
            <Tooltip.Provider delayDuration={300}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={() => setShowEmoji((v) => !v)}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <SmilePlus className="h-3.5 w-3.5" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="rounded-md bg-card border border-border px-2 py-1 text-xs shadow-md"
                    sideOffset={4}
                  >
                    React
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>

            {isOwn && (
              <>
                <button
                  onClick={() => onEdit(message)}
                  className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDelete(message.id)}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Quick emoji picker */}
          {showEmoji && (
            <div
              className={cn(
                'absolute z-10 flex gap-1 rounded-xl border border-border bg-card p-1.5 shadow-xl',
                isOwn ? 'right-0 bottom-full mb-1' : 'left-0 bottom-full mb-1',
              )}
            >
              {QUICK_EMOJIS.map((emoji) => {
                const hasReacted = message.reactions?.some(
                  (r) =>
                    r.emoji === emoji && r.userIds?.includes(user?.id ?? ''),
                );
                return (
                  <button
                    key={emoji}
                    onClick={() => {
                      if (hasReacted) {
                        onRemoveReaction(message.id, emoji);
                      } else {
                        onReaction(message.id, emoji);
                      }
                      setShowEmoji(false);
                    }}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors',
                      hasReacted ? 'bg-primary/20' : 'hover:bg-accent',
                    )}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => {
                  const hasReacted = r.userIds?.includes(user?.id ?? '');
                  if (hasReacted) onRemoveReaction(message.id, r.emoji);
                  else onReaction(message.id, r.emoji);
                }}
                className={cn(
                  'flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs transition-colors',
                  r.userIds?.includes(user?.id ?? '')
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-border bg-card hover:bg-accent',
                )}
              >
                <span>{r.emoji}</span>
                <span className="text-muted-foreground">{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function aggregateReactions(
  raw: Array<{ userId?: string; emoji?: string } & Record<string, unknown>>,
): MessageReaction[] {
  const map = new Map<string, MessageReaction>();
  for (const r of raw ?? []) {
    if (!r.emoji) continue;
    const entry = map.get(r.emoji);
    if (entry) {
      entry.count++;
      if (r.userId) entry.userIds.push(r.userId);
    } else {
      map.set(r.emoji, {
        emoji: r.emoji,
        count: 1,
        userIds: r.userId ? [r.userId] : [],
      });
    }
  }
  return Array.from(map.values());
}

function normalizeMessageReactions(msg: Message): Message {
  if (!msg.reactions?.length) return msg;
  const first = msg.reactions[0];
  if (typeof first.count === 'number' && first.count > 0 && first.userIds !== undefined) {
    return msg;
  }
  return { ...msg, reactions: aggregateReactions(msg.reactions as never) };
}

// ── Main ChatPage ─────────────────────────────────────────────────────────────

export function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const isValidChatId = !!chatId && UUID_REGEX.test(chatId);
  const navigate = useNavigate();
  const { user, privateKey } = useAuthStore();
  const cryptoStore = useCryptoStore();
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [sending, setSending] = useState(false);

  // Typing indicators
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(
    new Map(),
  );
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const ownTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Add member dialog
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<MemberRole>('MEMBER');
  const [addingMember, setAddingMember] = useState(false);

  // Delete chat dialog
  const [deleteChatOpen, setDeleteChatOpen] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const activeChatIdRef = useRef<string | undefined>(undefined);

  // ── Fetch chat metadata ──────────────────────────────────────────────────────

  const { data: chatData } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => chatsApi.getChat(chatId!),
    enabled: isValidChatId,
  });

  const chat = chatData?.chat;

  // ── Load + decrypt sender keys ───────────────────────────────────────────────

  const loadAndDecryptSenderKeys = useCallback(
    async (keys: SenderKey[]) => {
      if (!privateKey || !chatId) return;
      for (const key of keys) {
        const existing = cryptoStore.getChainKey(chatId, key.senderId);
        if (existing) continue;
        try {
          const chainKey = await decryptChainKey(
            key.encryptedSenderKey,
            privateKey,
          );
          cryptoStore.setChainKey(chatId, key.senderId, chainKey);
        } catch {
          // ignore keys we can't decrypt
        }
      }
    },
    [privateKey, chatId, cryptoStore],
  );

  // ── Fetch and decrypt messages ───────────────────────────────────────────────

  const decryptMessages = useCallback(
    async (rawMessages: Message[]): Promise<Message[]> => {
      if (!chatId) return rawMessages;
      return Promise.all(
        rawMessages.map(async (msg) => {
          const chainKey = cryptoStore.getChainKey(chatId, msg.senderId);
          if (!chainKey) return msg;
          try {
            const decryptedContent = await decryptWithChainKey(
              msg.payload,
              chainKey,
            );
            return { ...msg, decryptedContent };
          } catch {
            return msg;
          }
        }),
      );
    },
    [chatId, cryptoStore],
  );

  const fetchMessages = useCallback(async () => {
    if (!chatId || !UUID_REGEX.test(chatId)) return;
    const fetchingFor = chatId;
    try {
      try {
        const { keys } = await senderKeysApi.getSenderKeys(chatId);
        await loadAndDecryptSenderKeys(keys);
      } catch {
        // ignore
      }

      const { messages: raw } = await messagesApi.getMessages(chatId, {
        limit: 50,
      });
      const normalized = raw.map(normalizeMessageReactions);
      const decrypted = await decryptMessages(normalized);
      // Guard: discard if user switched chats while this fetch was in flight
      if (activeChatIdRef.current !== fetchingFor) return;
      setMessages([...decrypted].reverse());
    } catch {
      // ignore
    }
  }, [chatId, decryptMessages, loadAndDecryptSenderKeys]);

  // ── Initial load ─────────────────────────────────────────────────────────────

  // Clear messages immediately on chatId change (synchronous, before any fetch)
  useEffect(() => {
    activeChatIdRef.current = chatId;
    setMessages([]);
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    fetchMessages();
  }, [chatId, fetchMessages]);

  // ── WebSocket subscription ───────────────────────────────────────────────────

  useEffect(() => {
    if (!chatId) return;

    const socket = getSocket();
    if (!socket) return;

    const onTypingStart = ({
      chatId: cid,
      userId,
      username,
    }: {
      chatId: string;
      userId: string;
      username: string;
    }) => {
      if (cid !== chatId || userId === user?.id) return;
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.set(userId, username);
        return next;
      });
      // Auto-clear after 4 s if no stop event
      const timer = typingTimers.current.get(userId);
      if (timer) clearTimeout(timer);
      typingTimers.current.set(
        userId,
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Map(prev);
            next.delete(userId);
            return next;
          });
        }, 4000),
      );
    };

    const onTypingStop = ({
      chatId: cid,
      userId,
    }: {
      chatId: string;
      userId: string;
    }) => {
      if (cid !== chatId) return;
      const timer = typingTimers.current.get(userId);
      if (timer) clearTimeout(timer);
      typingTimers.current.delete(userId);
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    };

    const onSenderKeyReceived = async ({
      chatId: cid,
      senderId,
      encryptedSenderKey,
    }: {
      chatId: string;
      senderId: string;
      encryptedSenderKey: string;
      keyVersion: number;
    }) => {
      if (cid !== chatId || !privateKey) return;
      try {
        const chainKey = await decryptChainKey(encryptedSenderKey, privateKey);
        cryptoStore.setChainKey(chatId, senderId, chainKey);
      } catch {
        // ignore
      }
    };

    const tryDecrypt = async (msg: Message): Promise<Message> => {
      let chainKey = cryptoStore.getChainKey(chatId, msg.senderId);
      if (!chainKey && privateKey) {
        try {
          const { key } = await senderKeysApi.getSenderKeyBySender(
            chatId,
            msg.senderId,
          );
          if (key?.encryptedSenderKey) {
            chainKey = await decryptChainKey(
              key.encryptedSenderKey,
              privateKey,
            );
            cryptoStore.setChainKey(chatId, msg.senderId, chainKey);
          }
        } catch {
          /* ignore */
        }
      }
      if (!chainKey) return msg;
      try {
        const decryptedContent = await decryptWithChainKey(
          msg.payload,
          chainKey,
        );
        return { ...msg, decryptedContent };
      } catch {
        return msg;
      }
    };

    const onMessageNew = async (data: { message: Message }) => {
      const msg = data?.message;
      if (!msg || msg.chatId !== chatId) return;
      const decrypted = await tryDecrypt(normalizeMessageReactions(msg));
      setMessages((prev) => {
        if (prev.some((m) => m.id === decrypted.id)) return prev;
        return [...prev, decrypted];
      });
    };

    const onMessageUpdated = async (data: { message: Message }) => {
      const msg = data?.message;
      if (!msg || msg.chatId !== chatId) return;
      const decrypted = await tryDecrypt(normalizeMessageReactions(msg));
      setMessages((prev) =>
        prev.map((m) => (m.id === decrypted.id ? decrypted : m)),
      );
    };

    const onMessageDeleted = ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    const onReactionAdded = ({
      chatId: cid,
      messageId,
      userId,
      emoji,
    }: {
      chatId: string;
      messageId: string;
      userId: string;
      emoji: string;
    }) => {
      if (cid !== chatId) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const reactions = [...(m.reactions ?? [])];
          const idx = reactions.findIndex((r) => r.emoji === emoji);
          if (idx >= 0) {
            reactions[idx] = {
              ...reactions[idx],
              count: reactions[idx].count + 1,
              userIds: [...(reactions[idx].userIds ?? []), userId],
            };
          } else {
            reactions.push({ emoji, count: 1, userIds: [userId] });
          }
          return { ...m, reactions };
        }),
      );
    };

    const onReactionRemoved = ({
      chatId: cid,
      messageId,
      userId,
      emoji,
    }: {
      chatId: string;
      messageId: string;
      userId: string;
      emoji: string;
    }) => {
      if (cid !== chatId) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const reactions = (m.reactions ?? [])
            .map((r) =>
              r.emoji !== emoji
                ? r
                : {
                    ...r,
                    count: r.count - 1,
                    userIds: (r.userIds ?? []).filter((id) => id !== userId),
                  },
            )
            .filter((r) => r.count > 0);
          return { ...m, reactions };
        }),
      );
    };

    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    socket.on('sender_key:received', onSenderKeyReceived);
    socket.on('message:new', onMessageNew);
    socket.on('message:updated', onMessageUpdated);
    socket.on('message:deleted', onMessageDeleted);
    socket.on('message:reaction_added', onReactionAdded);
    socket.on('message:reaction_removed', onReactionRemoved);

    return () => {
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      socket.off('sender_key:received', onSenderKeyReceived);
      socket.off('message:new', onMessageNew);
      socket.off('message:updated', onMessageUpdated);
      socket.off('message:deleted', onMessageDeleted);
      socket.off('message:reaction_added', onReactionAdded);
      socket.off('message:reaction_removed', onReactionRemoved);
    };
  }, [chatId, user?.id, privateKey, cryptoStore]);

  // ── Scroll to bottom on new messages ─────────────────────────────────────────

  useEffect(() => {
    const viewport = scrollAreaRef.current;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [messages.length]);

  // ── Send message ─────────────────────────────────────────────────────────────

  async function handleSend() {
    if (!input.trim() || !chatId || !user || !privateKey) return;

    const plaintext = input.trim();
    setInput('');
    setSending(true);

    // Stop typing
    if (ownTypingTimer.current) {
      clearTimeout(ownTypingTimer.current);
      ownTypingTimer.current = null;
    }
    emitTypingStop(chatId);

    try {
      // Ensure we have a chain key for ourselves
      let chainKey = cryptoStore.getChainKey(chatId, user.id);
      if (!chainKey) {
        chainKey = generateChainKey();
        cryptoStore.setChainKey(chatId, user.id, chainKey);

        // Distribute to all chat members
        const members = chat?.members ?? [];
        const keysToDistribute: Array<{
          senderId: string;
          recipientId: string;
          encryptedSenderKey: string;
          keyVersion: number;
        }> = [];

        for (const member of members) {
          try {
            const { publicKey } = await authApi.getUserPublicKey(member.userId);
            const encryptedSenderKey = await encryptChainKeyForRecipient(
              chainKey,
              publicKey,
            );
            keysToDistribute.push({
              senderId: user.id,
              recipientId: member.userId,
              encryptedSenderKey,
              keyVersion: 1,
            });
          } catch {
            // skip
          }
        }

        if (keysToDistribute.length > 0) {
          await senderKeysApi.distributeSenderKeys(chatId, keysToDistribute);
        }
      }

      const iteration = cryptoStore.getNextIteration(chatId);
      cryptoStore.incrementIteration(chatId);

      if (editingMessage) {
        const payload = await encryptWithChainKey(
          plaintext,
          chainKey,
          iteration,
        );
        await messagesApi.editMessage(chatId, editingMessage.id, payload);
        setEditingMessage(null);
        toast.success('Message edited');
      } else {
        const payload = await encryptWithChainKey(
          plaintext,
          chainKey,
          iteration,
        );
        await messagesApi.sendMessage(chatId, payload, 'TEXT');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to send message';
      toast.error(typeof msg === 'string' ? msg : 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  // ── Typing detection ─────────────────────────────────────────────────────────

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
    if (!chatId) return;

    emitTypingStart(chatId);
    if (ownTypingTimer.current) clearTimeout(ownTypingTimer.current);
    ownTypingTimer.current = setTimeout(() => {
      emitTypingStop(chatId);
      ownTypingTimer.current = null;
    }, 3000);
  }

  // ── Delete message ───────────────────────────────────────────────────────────

  async function handleDelete(messageId: string) {
    if (!chatId) return;
    try {
      await messagesApi.deleteMessage(chatId, messageId);
    } catch {
      toast.error('Failed to delete message');
    }
  }

  // ── Reactions ────────────────────────────────────────────────────────────────

  async function handleReaction(messageId: string, emoji: string) {
    if (!chatId) return;
    try {
      await messagesApi.addReaction(chatId, messageId, emoji);
    } catch {
      toast.error('Failed to add reaction');
    }
  }

  async function handleRemoveReaction(messageId: string, emoji: string) {
    if (!chatId) return;
    try {
      await messagesApi.removeReaction(chatId, messageId, emoji);
    } catch {
      toast.error('Failed to remove reaction');
    }
  }

  // ── Add member ───────────────────────────────────────────────────────────────

  async function handleAddMember() {
    if (!chatId || !newMemberUserId.trim() || !user || !privateKey) return;
    if (!UUID_REGEX.test(newMemberUserId.trim())) {
      toast.error('Invalid user ID — paste a valid UUID from the Settings page');
      return;
    }
    setAddingMember(true);
    try {
      await chatsApi.addMember(chatId, newMemberUserId.trim(), newMemberRole);

      // Distribute our chain key to the new member
      const chainKey = cryptoStore.getChainKey(chatId, user.id);
      if (chainKey) {
        try {
          const { publicKey } = await authApi.getUserPublicKey(
            newMemberUserId.trim(),
          );
          const encryptedSenderKey = await encryptChainKeyForRecipient(
            chainKey,
            publicKey,
          );
          await senderKeysApi.distributeSenderKeys(chatId, [
            {
              senderId: user.id,
              recipientId: newMemberUserId.trim(),
              encryptedSenderKey,
              keyVersion: 1,
            },
          ]);
        } catch {
          // ignore key distribution failure
        }
      }

      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
      setAddMemberOpen(false);
      setNewMemberUserId('');
      setNewMemberRole('MEMBER');
      toast.success('Member added');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to add member';
      toast.error(typeof msg === 'string' ? msg : 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  }

  // ── Delete chat ───────────────────────────────────────────────────────────────

  async function handleDeleteChat() {
    if (!chatId) return;
    setDeletingChat(true);
    try {
      await chatsApi.deleteChat(chatId);
      cryptoStore.clearChat(chatId);
      queryClient.removeQueries({ queryKey: ['chat', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      navigate('/');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to delete chat';
      toast.error(typeof msg === 'string' ? msg : 'Failed to delete chat');
      setDeleteChatOpen(false);
    } finally {
      setDeletingChat(false);
    }
  }

  // ── Mark read on scroll ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!chatId || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    messagesApi.markRead(chatId, lastMessage.id).catch(() => undefined);
  }, [chatId, messages.length]);

  if (!isValidChatId) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Chat not found.</p>
      </div>
    );
  }

  // ── Chat header icon ──────────────────────────────────────────────────────────

  function ChatTypeIconLarge() {
    if (!chat) return null;
    if (chat.type === 'DIRECT') return <MessageSquare className="h-5 w-5" />;
    if (chat.type === 'CHANNEL') return <Hash className="h-5 w-5" />;
    return <Users className="h-5 w-5" />;
  }

  const chatDisplayName = (() => {
    if (!chat) return '...';
    if (chat.type === 'DIRECT') {
      const other = chat.members.find((m) => m.userId !== user?.id);
      return other?.username ?? other?.userId ?? 'Unknown';
    }
    return (
      chat.name ?? chat.members.map((m) => m.username ?? m.userId).join(', ')
    );
  })();

  // ── Sender username lookup map ────────────────────────────────────────────────

  const senderNames: Record<string, string> = {};
  for (const m of chat?.members ?? []) {
    if (m.username) senderNames[m.userId] = m.username;
  }

  // ── Group messages by date ────────────────────────────────────────────────────

  const groupedMessages: Array<{ date: string; messages: Message[] }> = [];
  for (const msg of messages) {
    const d = new Date(msg.createdAt);
    const dateStr = isNaN(d.getTime())
      ? 'Unknown date'
      : d.toLocaleDateString();
    const last = groupedMessages[groupedMessages.length - 1];
    if (!last || last.date !== dateStr) {
      groupedMessages.push({ date: dateStr, messages: [msg] });
    } else {
      last.messages.push(msg);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-muted-foreground">
          <ChatTypeIconLarge />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate">
            {chatDisplayName}
          </h2>
          <div className="flex items-center gap-2">
            {chat && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {chat.type}
              </Badge>
            )}
            {chat && (
              <span className="text-xs text-muted-foreground">
                {chat.members.length} member
                {chat.members.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setAddMemberOpen(true)}
          title="Add member"
        >
          <UserPlus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeleteChatOpen(true)}
          title="Delete chat"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea.Root className="flex-1 overflow-hidden">
        <ScrollArea.Viewport ref={scrollAreaRef} className="h-full w-full">
          <div className="flex flex-col gap-1 p-4">
            {groupedMessages.map((group) => (
              <div key={group.date}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground px-2">
                    {group.date}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="flex flex-col gap-3">
                  {group.messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.senderId === user?.id}
                      chatId={chatId!}
                      senderNames={senderNames}
                      onEdit={setEditingMessage}
                      onDelete={handleDelete}
                      onReaction={handleReaction}
                      onRemoveReaction={handleRemoveReaction}
                    />
                  ))}
                </div>
              </div>
            ))}

            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-muted-foreground text-sm">
                  No messages yet. Say hello!
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          orientation="vertical"
          className="flex w-1.5 touch-none select-none p-0.5"
        >
          <ScrollArea.Thumb className="relative flex-1 rounded-full bg-border" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>

      {/* Typing indicators */}
      {typingUsers.size > 0 && (
        <div className="px-4 py-1 shrink-0">
          <p className="text-xs text-muted-foreground italic">
            {Array.from(typingUsers.values()).join(', ')}{' '}
            {typingUsers.size === 1 ? 'is' : 'are'} typing…
          </p>
        </div>
      )}

      {/* Edit bar */}
      {editingMessage && (
        <div className="flex items-center gap-2 border-t border-border bg-accent/30 px-4 py-2 shrink-0">
          <Pencil className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="flex-1 text-xs text-muted-foreground truncate">
            Editing: {editingMessage.decryptedContent ?? '🔒'}
          </p>
          <button
            onClick={() => {
              setEditingMessage(null);
              setInput('');
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-3 shrink-0">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={editingMessage ? 'Edit message…' : 'Type a message…'}
            maxLength={4000}
            className={cn(
              'flex-1 rounded-xl border border-input bg-card px-4 py-2.5 text-sm',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-1 focus:ring-ring',
              'transition-colors',
            )}
            disabled={!privateKey}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || !privateKey}
            loading={sending}
          >
            {editingMessage ? (
              <Check className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {!privateKey && (
          <p className="mt-1 text-xs text-muted-foreground text-center">
            Encryption keys not loaded — please re-authenticate
          </p>
        )}
      </div>

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>
              Enter the user ID of the person you want to add.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <Input
              label="User ID"
              value={newMemberUserId}
              onChange={(e) => setNewMemberUserId(e.target.value)}
              placeholder="Paste user UUID"
              maxLength={36}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Role</label>
              <div className="flex gap-2">
                {(['MEMBER', 'ADMIN'] as MemberRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => setNewMemberRole(role)}
                    className={cn(
                      'flex-1 rounded-md border px-3 py-2 text-sm transition-colors',
                      newMemberRole === role
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-accent',
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} loading={addingMember}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Chat Dialog */}
      <Dialog open={deleteChatOpen} onOpenChange={setDeleteChatOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete chat</DialogTitle>
            <DialogDescription>
              This will permanently delete the chat, all messages, and all
              encryption keys. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeleteChatOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteChat}
              loading={deletingChat}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
