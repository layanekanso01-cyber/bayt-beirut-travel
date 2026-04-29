import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { LogIn, MapPin, ShieldCheck } from 'lucide-react';
import { AuthSwitcher } from '@/components/auth-switcher';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user?.role === 'admin') navigate('/admin/dashboard');
    if (user?.role === 'user') navigate('/home');
  }, [navigate, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({ title: 'Please enter both username and password', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await login(username, password);
      const savedUser = JSON.parse(localStorage.getItem('user') || 'null') as { role?: string } | null;
      toast({ title: 'Welcome back!' });
      navigate(savedUser?.role === 'admin' ? '/admin/dashboard' : '/home');
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Invalid username or password',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden min-h-[620px] overflow-hidden bg-neutral-900 text-white lg:block">
          <img
            src="https://commons.wikimedia.org/wiki/Special:FilePath/Pigeon%20Rocks%20of%20Beirut%2C%20Rock%20of%20Raouche%2C%20Beirut%2C%20Lebanon.jpg?width=1400"
            alt="Lebanon coast"
            className="absolute inset-0 h-full w-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
          <div className="relative flex h-full flex-col justify-between p-10">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              <MapPin className="h-4 w-4" />
              Bayt Beirut Travel
            </div>
            <div>
              <h1 className="max-w-xl text-5xl font-black leading-tight">Plan, book, and verify your Lebanon trip.</h1>
              <p className="mt-4 max-w-md text-base leading-7 text-white/85">
                Discover ruins, beaches, mountains, nightlife, and QR-ready digital tickets in one travel experience.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-5 sm:p-8">
          <Card className="w-full max-w-md border-0 p-0 shadow-none">
            <div className="mb-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <LogIn className="h-6 w-6" />
              </div>
              <h1 className="text-4xl font-bold">Sign In</h1>
              <p className="mt-2 text-muted-foreground">Access your trips or admin dashboard.</p>
            </div>

            <AuthSwitcher active="login" />

            <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <Input
                  type="text"
                  placeholder="Your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <Input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <p className="flex items-center gap-2 font-medium text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Admin demo access
              </p>
              <p className="mt-1">Use ziad / ziad123 or layane / layane123.</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/signup" className="text-primary hover:underline font-medium">
                  Create one
                </Link>
              </p>
            </div>
          </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
