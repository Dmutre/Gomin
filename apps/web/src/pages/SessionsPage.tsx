import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Monitor, Smartphone, Globe, Trash2, ShieldAlert } from 'lucide-react';
import { authApi } from '../lib/api';
import { useAuthStore } from '../store/auth.store';
import { toast } from '../store/toast.store';
import { formatDate } from '../lib/utils';
import type { Session } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../components/ui/dialog';

function getPlatformIcon(session: Session) {
  const ua = session.deviceInfo?.userAgent ?? '';
  if (/mobile|android|iphone/i.test(ua))
    return <Smartphone className="h-5 w-5" />;
  return <Monitor className="h-5 w-5" />;
}

function SessionCard({
  session,
  isCurrent,
  onTerminate,
}: {
  session: Session;
  isCurrent: boolean;
  onTerminate: (token: string) => void;
}) {
  return (
    <div
      className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
        isCurrent ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-muted-foreground">
        {getPlatformIcon(session)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-foreground">
            {session.deviceInfo?.deviceName ?? 'Unknown Device'}
          </span>
          {isCurrent && (
            <Badge variant="success" className="text-[10px]">
              Current
            </Badge>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {session.ipAddress ?? 'Unknown IP'}
          </span>
          <span>Platform: {session.deviceInfo?.os ?? 'Unknown'}</span>
          <span>Created: {formatDate(session.createdAt)}</span>
          {session.lastActivityAt && (
            <span>Last active: {formatDate(session.lastActivityAt)}</span>
          )}
          <span>Expires: {formatDate(session.expiresAt)}</span>
        </div>
      </div>

      {!isCurrent && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onTerminate(session.sessionToken)}
          className="shrink-0 text-muted-foreground hover:text-destructive"
          title="Terminate session"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function SessionsPage() {
  const { sessionToken } = useAuthStore();
  const queryClient = useQueryClient();

  const [terminateAllOpen, setTerminateAllOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [terminating, setTerminating] = useState(false);
  const [terminatingToken, setTerminatingToken] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => authApi.getSessions(),
    refetchInterval: 30000,
  });

  const sessions = data?.sessions ?? [];

  async function handleTerminate(token: string) {
    const pw = prompt('Enter your password to terminate this session:');
    if (!pw) return;
    setTerminatingToken(token);
    try {
      await authApi.terminateSession(token, pw);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session terminated');
    } catch {
      toast.error('Failed to terminate session — check your password');
    } finally {
      setTerminatingToken(null);
    }
  }

  async function handleTerminateAll() {
    if (!password) return;
    setTerminating(true);
    try {
      await authApi.terminateAllOtherSessions(password);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setTerminateAllOpen(false);
      setPassword('');
      toast.success('All other sessions terminated');
    } catch {
      toast.error('Failed — check your password');
    } finally {
      setTerminating(false);
    }
  }

  const currentSession = sessions.find(
    (s) => s.sessionToken === sessionToken || s.isCurrent,
  );
  const otherSessions = sessions.filter(
    (s) => s.sessionToken !== sessionToken && !s.isCurrent,
  );

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription className="mt-1">
                  Manage devices that are signed in to your account.
                </CardDescription>
              </div>
              {otherSessions.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setTerminateAllOpen(true)}
                >
                  <ShieldAlert className="h-4 w-4" />
                  Terminate All Others
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No sessions found.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {currentSession && (
                  <SessionCard
                    session={currentSession}
                    isCurrent={true}
                    onTerminate={handleTerminate}
                  />
                )}
                {otherSessions.map((session) => (
                  <SessionCard
                    key={session.sessionToken}
                    session={session}
                    isCurrent={false}
                    onTerminate={handleTerminate}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Terminate All Dialog */}
      <Dialog open={terminateAllOpen} onOpenChange={setTerminateAllOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Terminate All Other Sessions</DialogTitle>
            <DialogDescription>
              This will sign out all other devices. Your current session will
              remain active.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              label="Confirm Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              onKeyDown={(e) => e.key === 'Enter' && handleTerminateAll()}
            />
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setTerminateAllOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleTerminateAll}
              loading={terminating}
            >
              Terminate All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
