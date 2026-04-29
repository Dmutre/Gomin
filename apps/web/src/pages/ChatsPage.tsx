import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Plus, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi, chatsApi, senderKeysApi } from '../lib/api';
import { encryptChainKeyForRecipient, generateChainKey } from '../lib/crypto';
import { useCryptoStore } from '../store/crypto.store';
import { useAuthStore } from '../store/auth.store';
import { toast } from '../store/toast.store';
import type { Chat, ChatType } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';

const CHAT_TYPE_OPTIONS: {
  value: ChatType;
  label: string;
  description: string;
}[] = [
  {
    value: 'DIRECT',
    label: 'Direct Message',
    description: '1-on-1 private conversation',
  },
  {
    value: 'GROUP',
    label: 'Group Chat',
    description: 'Private group with multiple members',
  },
];

export function ChatsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, privateKey } = useAuthStore();
  const setChainKey = useCryptoStore((s) => s.setChainKey);

  const [open, setOpen] = useState(false);
  const [chatType, setChatType] = useState<ChatType>('DIRECT');
  const [chatName, setChatName] = useState('');
  const [memberInput, setMemberInput] = useState('');
  const [memberUsernames, setMemberUsernames] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  function addMember() {
    const username = memberInput.trim();
    if (!username || memberUsernames.includes(username)) return;
    setMemberUsernames((prev) => [...prev, username]);
    setMemberInput('');
  }

  function removeMember(username: string) {
    setMemberUsernames((prev) => prev.filter((m) => m !== username));
  }

  async function handleCreate() {
    if (!user || !privateKey) return;
    if (chatType !== 'DIRECT' && memberUsernames.length === 0) {
      toast.error('Add at least one member');
      return;
    }

    // For DIRECT chats, navigate to the existing one if already in cache
    if (chatType === 'DIRECT' && memberUsernames.length > 0) {
      const cached = queryClient.getQueryData<{ chats: Chat[] }>(['chats']);
      const existing = cached?.chats.find(
        (c) =>
          c.type === 'DIRECT' &&
          c.members.some(
            (m) => m.username === memberUsernames[0] && m.userId !== user.id,
          ),
      );
      if (existing) {
        setOpen(false);
        resetForm();
        navigate(`/chats/${existing.id}`);
        return;
      }
    }

    setCreating(true);
    try {
      const { chat } = await chatsApi.createChat({
        type: chatType,
        name: chatName || undefined,
        memberUsernames,
      });

      // Generate our chain key and distribute to all members
      const chainKey = generateChainKey();
      setChainKey(chat.id, user.id, chainKey);

      // Encrypt chain key for each member + ourselves (use resolved userIds from chat)
      const recipientIds = [
        ...new Set([...chat.members.map((m) => m.userId), user.id]),
      ];
      const keysToDistribute: Array<{
        senderId: string;
        recipientId: string;
        encryptedSenderKey: string;
        keyVersion: number;
      }> = [];

      for (const recipientId of recipientIds) {
        try {
          const { publicKey } = await authApi.getUserPublicKey(recipientId);
          const encryptedSenderKey = await encryptChainKeyForRecipient(
            chainKey,
            publicKey,
          );
          keysToDistribute.push({
            senderId: user.id,
            recipientId,
            encryptedSenderKey,
            keyVersion: 1,
          });
        } catch {
          // skip if can't fetch public key
        }
      }

      if (keysToDistribute.length > 0) {
        await senderKeysApi.distributeSenderKeys(chat.id, keysToDistribute);
      }

      queryClient.invalidateQueries({ queryKey: ['chats'] });
      setOpen(false);
      resetForm();
      toast.success('Chat created!');
      navigate(`/chats/${chat.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? '';
      if (typeof msg === 'string' && msg.startsWith('DIRECT_EXISTS:')) {
        const existingId = msg.slice('DIRECT_EXISTS:'.length);
        setOpen(false);
        resetForm();
        navigate(`/chats/${existingId}`);
        return;
      }
      toast.error(typeof msg === 'string' && msg ? msg : 'Failed to create chat');
    } finally {
      setCreating(false);
    }
  }

  function resetForm() {
    setChatType('DIRECT');
    setChatName('');
    setMemberInput('');
    setMemberUsernames([]);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Select a chat</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Choose a conversation from the sidebar or start a new one.
        </p>
      </div>

      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New Chat
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Chat</DialogTitle>
            <DialogDescription>
              Choose a type and add members to start a conversation.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Chat type */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Type</label>
              <div className="flex flex-col gap-1.5">
                {CHAT_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setChatType(opt.value)}
                    className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      chatType === opt.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name (for group) */}
            {chatType === 'GROUP' && (
              <Input
                label="Chat Name"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
                placeholder="e.g. Project Gomin"
              />
            )}

            {/* Members */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Members
                {chatType === 'DIRECT' && (
                  <span className="text-muted-foreground ml-1">
                    (one required)
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <Input
                  value={memberInput}
                  onChange={(e) => setMemberInput(e.target.value)}
                  placeholder="Enter username"
                  onKeyDown={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), addMember())
                  }
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addMember}
                  type="button"
                >
                  Add
                </Button>
              </div>
              {memberUsernames.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {memberUsernames.map((username) => (
                    <span
                      key={username}
                      className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs"
                    >
                      <span>@{username}</span>
                      <button
                        onClick={() => removeMember(username)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={creating} type="button">
              Create Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
