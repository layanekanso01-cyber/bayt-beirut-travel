import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);

    try {
      await login(username, password);
      const savedUser = JSON.parse(localStorage.getItem("user") || "null") as { role?: string } | null;
      if (savedUser?.role !== "admin") {
        navigate("/home");
        return;
      }
      toast({ title: "Admin login successful" });
      navigate("/admin/dashboard");
    } catch (error) {
      toast({
        title: "Admin login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <header className="border-b border-border bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="font-serif text-xl font-bold text-primary">
            Bayt Beirut Admin
          </Link>
          <Button asChild variant="outline">
            <Link href="/">Back to site</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md p-8 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-serif font-bold">Admin Login</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Use the same authentication system. Admins are redirected to the dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Username</label>
              <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="admin" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="admin123"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Login as Admin"}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
