import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Mail, Send, ShieldCheck, Users } from "lucide-react";
import { Navbar, Footer } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";

type Subscriber = {
  email: string;
  createdAt?: string;
};

const adminEmails = "layanekanso01@gmail.com,ziadchatila2005@gmail.com";

function readLocalSubscribers() {
  return JSON.parse(localStorage.getItem("newsletterSubscribers") || "[]") as string[];
}

export default function AdminNewsletter() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [, navigate] = useLocation();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subject, setSubject] = useState("Bayt Beirut Travel Newsletter");
  const [message, setMessage] = useState(
    "Hello,\n\nHere are our latest Lebanon travel recommendations, routes, and seasonal experiences.\n\nBest,\nBayt Beirut Travel"
  );

  useEffect(() => {
    if (!isAdmin) {
      navigate(user ? "/home" : "/");
      return;
    }

    async function loadSubscribers() {
      try {
        const response = await fetch("/api/newsletter/subscribers");
        if (!response.ok) throw new Error("Failed");
        const data = (await response.json()) as Subscriber[];
        const localSubscribers = readLocalSubscribers().map((email) => ({ email }));
        const merged = [...data, ...localSubscribers].filter(
          (subscriber, index, allSubscribers) =>
            allSubscribers.findIndex((item) => item.email === subscriber.email) === index
        );
        setSubscribers(merged);
      } catch {
        setSubscribers(readLocalSubscribers().map((email) => ({ email })));
      }
    }

    loadSubscribers();
  }, [isAdmin, navigate, user]);

  if (!isAdmin) return null;

  const recipientEmails = useMemo(() => {
    return subscribers.map((subscriber) => subscriber.email).join(",");
  }, [subscribers]);

  function sendNewsletter() {
    const subjectText = encodeURIComponent(subject);
    const bodyText = encodeURIComponent(message);
    window.location.href = `mailto:${adminEmails}?bcc=${recipientEmails}&subject=${subjectText}&body=${bodyText}`;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="border-b border-border bg-muted/30 py-14">
          <div className="container mx-auto px-4">
            <Badge variant="secondary" className="mb-4 gap-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin
            </Badge>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
              Newsletter Admin
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
              View subscriber emails and send a newsletter draft using your email app.
            </p>
          </div>
        </section>

        <section className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-xl border border-border bg-card p-4 shadow-md">
            <h2 className="flex items-center gap-2 text-2xl font-serif font-bold">
              <Users className="h-5 w-5 text-primary" />
              Subscribers
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{subscribers.length} emails collected</p>

            <div className="mt-5 max-h-[460px] space-y-2 overflow-y-auto">
              {subscribers.length > 0 ? (
                subscribers.map((subscriber) => (
                  <div key={subscriber.email} className="rounded-lg border border-border bg-background p-3">
                    <p className="font-medium">{subscriber.email}</p>
                    {subscriber.createdAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Joined {new Date(subscriber.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                  No subscribers yet.
                </div>
              )}
            </div>
          </aside>

          <section className="rounded-xl border border-border bg-card p-4 shadow-md">
            <h2 className="flex items-center gap-2 text-2xl font-serif font-bold">
              <Mail className="h-5 w-5 text-primary" />
              Compose newsletter
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Subject</label>
                <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Message</label>
                <Textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="min-h-56"
                />
              </div>
              <Button onClick={sendNewsletter} disabled={subscribers.length === 0} className="gap-2">
                <Send className="h-4 w-4" />
                Open email draft
              </Button>
              <p className="text-sm text-muted-foreground">
                This uses BCC so subscribers do not see each other's emails.
              </p>
            </div>
          </section>
        </section>
      </main>

      <Footer />
    </div>
  );
}
