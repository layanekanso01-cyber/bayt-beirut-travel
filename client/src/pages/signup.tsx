import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { MapPin, UserPlus } from 'lucide-react';
import { AuthSwitcher } from '@/components/auth-switcher';

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nationality, setNationality] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, signup } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user?.role === 'admin') navigate('/admin/dashboard');
    if (user?.role === 'user') navigate('/home');
  }, [navigate, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({ title: 'Username required', variant: 'destructive' });
      return;
    }

    if (!email.trim()) {
      toast({ title: 'Email required', description: 'Please enter your Gmail or email for booking confirmations.', variant: 'destructive' });
      return;
    }
    
    if (password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await signup(username, password, name, email, nationality, phone);
      toast({ title: 'Account created successfully!' });
      navigate('/home');
    } catch (error) {
      toast({
        title: 'Signup failed',
        description: error instanceof Error ? error.message : 'Please check your details and try again',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex items-center justify-center p-5 sm:p-8">
          <Card className="w-full max-w-lg border-0 p-0 shadow-none">
            <div className="mb-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <UserPlus className="h-6 w-6" />
              </div>
              <h1 className="text-4xl font-bold">Create Account</h1>
              <p className="mt-2 text-muted-foreground">Save bookings, QR tickets, favorites, and trip plans.</p>
            </div>

            <AuthSwitcher active="signup" />

            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <Input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <Input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nationality</label>
                <Input
                  type="text"
                  placeholder="e.g., Lebanese, American, French"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <Input
                  type="tel"
                  placeholder="+961 1 234 567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <Input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full sm:col-span-2" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign In
                </Link>
              </p>
            </div>
          </Card>
        </section>

        <section className="relative hidden min-h-[680px] overflow-hidden bg-neutral-900 text-white lg:block">
          <img
            src="https://commons.wikimedia.org/wiki/Special:FilePath/Forest%20of%20The%20cedars%20of%20God.jpg?width=1400"
            alt="Lebanon mountains"
            className="absolute inset-0 h-full w-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
          <div className="relative flex h-full flex-col justify-between p-10">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              <MapPin className="h-4 w-4" />
              Personal travel profile
            </div>
            <div>
              <h2 className="max-w-xl text-5xl font-black leading-tight">Build your Lebanon journey from the first click.</h2>
              <p className="mt-4 max-w-md text-base leading-7 text-white/85">
                Your account keeps bookings, QR tickets, saved places, and personalized recommendations together.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
