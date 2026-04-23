import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../lib/api';
import { generateKeyPair, unwrapPrivateKey, wrapPrivateKey } from '../lib/crypto';
import { initSocket } from '../lib/socket';
import { toast } from '../store/toast.store';
import { getDeviceInfo } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';

type Step = 'form' | 'generating' | 'registering';

export function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!username.trim()) errs.username = 'Username is required';
    if (username.length < 3) errs.username = 'Username must be at least 3 characters';
    if (!email.trim()) errs.email = 'Email is required';
    if (!password) errs.password = 'Password is required';
    if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    try {
      // Step 1: Generate RSA key pair
      setStep('generating');
      const keyPair = await generateKeyPair();
      const e2eeKeys = await wrapPrivateKey(keyPair, password);

      // Step 2: Register
      setStep('registering');
      const deviceInfo = getDeviceInfo();
      await authApi.register({
        username,
        email,
        password,
        e2eeKeys,
        deviceInfo,
      });

      // Auto-login
      const loginResponse = await authApi.login({ email, password, deviceInfo });
      const privateKey = await unwrapPrivateKey(loginResponse.e2eeKeys, password);

      login(
        loginResponse.user,
        loginResponse.sessionToken,
        privateKey,
        loginResponse.e2eeKeys.publicKey,
        loginResponse.e2eeKeys,
      );

      initSocket(loginResponse.sessionToken);
      toast.success('Account created! Welcome to Gomin.');
      navigate('/');
    } catch (err: unknown) {
      setStep('form');
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed.';
      toast.error(typeof msg === 'string' ? msg : 'Registration failed.');
    }
  }

  if (step !== 'form') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
            <div className="text-center">
              <p className="font-medium text-foreground">
                {step === 'generating' ? 'Generating encryption keys…' : 'Creating your account…'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {step === 'generating'
                  ? 'Generating RSA-2048 key pair. This may take a moment.'
                  : 'Uploading your encrypted keys and creating your account.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Create account</CardTitle>
          <CardDescription>Join Gomin — end-to-end encrypted messaging</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="cooluser"
              autoComplete="username"
              error={errors.username}
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email}
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              error={errors.password}
              required
            />
            <Input
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              autoComplete="new-password"
              error={errors.confirmPassword}
              required
            />

            <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
              A unique RSA-2048 key pair will be generated in your browser. Your private key is encrypted with your password and never leaves your device in plaintext.
            </p>

            <Button type="submit" className="w-full mt-1">
              Create account
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
