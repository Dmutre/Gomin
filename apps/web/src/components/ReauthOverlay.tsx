import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { unwrapPrivateKey } from '../lib/crypto';
import { initSocket } from '../lib/socket';
import { toast } from '../store/toast.store';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Spinner } from './ui/spinner';

/**
 * Shown when sessionToken is present but privateKey has been lost (page refresh).
 * The user provides their password to re-derive the private key from the stored e2eeKeys.
 */
export function ReauthOverlay() {
  const { e2eeKeys, sessionToken, setPrivateKey } = useAuthStore();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const logout = useAuthStore((s) => s.logout);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!e2eeKeys) return;
    setLoading(true);
    try {
      const privateKey = await unwrapPrivateKey(e2eeKeys, password);
      setPrivateKey(privateKey);
      if (sessionToken) initSocket(sessionToken);
      toast.success('Keys restored successfully');
    } catch {
      toast.error('Wrong password — could not decrypt private key');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-2xl">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="rounded-full bg-primary/10 p-3">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">Re-authenticate</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your session is still active. Enter your password to restore your
              encryption keys.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoFocus
            required
          />
          <Button type="submit" loading={loading} className="w-full">
            {loading ? 'Decrypting…' : 'Restore Keys'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={logout}
          >
            Sign out instead
          </Button>
        </form>
      </div>
    </div>
  );
}
