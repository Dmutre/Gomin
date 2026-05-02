import { useState } from 'react';
import { Copy, Check, KeyRound, User } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../lib/api';
import { decryptPrivateKeyBytes } from '../lib/crypto';
import { toast } from '../store/toast.store';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/card';

export function SettingsPage() {
  const { user, publicKeyB64, e2eeKeys, login, sessionToken } =
    useAuthStore();

  const [copied, setCopied] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  async function copyPublicKey() {
    if (!publicKeyB64) return;
    await navigator.clipboard.writeText(publicKeyB64);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!e2eeKeys || !user || !sessionToken) return;

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 12) {
      toast.error('Password must be at least 12 characters');
      return;
    }

    setChangingPassword(true);
    try {
      // Decrypt current private key bytes — throws if password wrong
      let oldKeyBuf: ArrayBuffer;
      try {
        oldKeyBuf = await decryptPrivateKeyBytes(e2eeKeys, currentPassword);
      } catch {
        toast.error('Current password is incorrect');
        return;
      }

      // Re-wrap raw key bytes with new password
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(newPassword),
        'PBKDF2',
        false,
        ['deriveKey'],
      );
      const salt = crypto.getRandomValues(new Uint8Array(32));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const wrapKey = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt'],
      );

      const encBuf = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        wrapKey,
        oldKeyBuf,
      );
      const encArr = new Uint8Array(encBuf);
      const b64 = (arr: Uint8Array) => btoa(String.fromCharCode(...arr));

      const newE2eeKeys = {
        publicKey: publicKeyB64!,
        encryptedPrivateKey: b64(encArr.slice(0, -16)),
        encryptionSalt: b64(salt),
        encryptionIv: b64(iv),
        encryptionAuthTag: b64(encArr.slice(-16)),
      };

      await authApi.changePassword({
        currentPassword,
        newPassword,
        e2eeKeys: newE2eeKeys,
      });

      const newPrivateKey = await crypto.subtle.importKey(
        'pkcs8',
        oldKeyBuf,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['decrypt'],
      );

      login(user, sessionToken, newPrivateKey, publicKeyB64!, newE2eeKeys);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed — re-login required on other devices');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to change password';
      toast.error(typeof msg === 'string' ? msg : 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 overflow-y-auto p-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and encryption keys
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
            <span className="text-muted-foreground">Username</span>
            <span className="font-medium text-foreground">
              {user?.username}
            </span>
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium text-foreground">{user?.email}</span>
            <span className="text-muted-foreground">User ID</span>
            <span className="font-mono text-xs text-foreground break-all">
              {user?.id}
            </span>
            <span className="text-muted-foreground">Member since</span>
            <span className="font-medium text-foreground">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : '—'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Public Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" />
            Your Public Key
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            Share this with other users so they can send you encrypted messages.
          </p>
          <div className="flex items-start gap-2">
            <pre className="flex-1 rounded-md bg-muted px-3 py-2 text-[10px] font-mono break-all whitespace-pre-wrap text-muted-foreground max-h-24 overflow-y-auto">
              {publicKeyB64 ?? '—'}
            </pre>
            <Button
              variant="outline"
              size="sm"
              onClick={copyPublicKey}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <Input
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
              maxLength={128}
              required
            />
            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 12 characters"
              autoComplete="new-password"
              maxLength={128}
              required
            />
            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              autoComplete="new-password"
              maxLength={128}
              required
            />
            <p className="text-xs text-muted-foreground">
              Changing your password re-encrypts your private key. Other devices
              will need to re-login.
            </p>
            <Button type="submit" loading={changingPassword} className="w-fit">
              {changingPassword ? 'Changing…' : 'Change password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
