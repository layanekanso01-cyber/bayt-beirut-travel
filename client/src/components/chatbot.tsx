import { useEffect, useRef, useState } from "react";
import { Bot, Brain, Loader2, MessageCircle, Send, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { scopedStorageKey } from "@/lib/user-scope";

type Message = {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
};

const quickOptions = [
  "Where should I go in Lebanon?",
  "I like beaches and food",
  "Suggest hiking places",
  "I want history and ruins",
  "Plan a Beirut nightlife evening",
  "Show me family-friendly nature",
];

function getSessionId(user: { id: string; username: string }) {
  const storageKey = scopedStorageKey(user, "lebanon-tourism-chat-session");
  const existing = localStorage.getItem(storageKey);
  if (existing) return existing;

  const next = `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(storageKey, next);
  return next;
}

export function ChatBot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi, I am your Bayt Beirut travel assistant. Ask me where to go, or tell me your preferences like beaches, hiking, history, food, or nightlife.",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef("");

  useEffect(() => {
    if (user) {
      sessionIdRef.current = getSessionId(user);
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now(),
      text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((current) => [...current, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId: sessionIdRef.current,
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data.memory?.preferences)) {
        setPreferences(data.memory.preferences);
      }

      const botMsg: Message = {
        id: Date.now() + 1,
        text: data.reply || "I could not generate a response. Try asking about beaches, history, hiking, food, or nightlife.",
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((current) => [...current, botMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          text: "I am having trouble connecting. If you just updated the backend, restart npm run dev and try again.",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    sendMessage(inputValue);
  }

  return (
    <>
      <Button
        className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-50 transition-transform duration-300 ${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
        onClick={() => setIsOpen(true)}
        aria-label="Open AI travel chat"
      >
        <MessageCircle className="w-7 h-7" />
      </Button>

      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "scale-100 opacity-100 w-[calc(100vw-2rem)] sm:w-[420px]"
            : "scale-0 opacity-0 w-0 h-0 pointer-events-none"
        }`}
      >
        <Card className="border-primary/20 shadow-2xl overflow-hidden flex flex-col h-[560px] max-h-[calc(100vh-3rem)]">
          <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 border-2 border-white/20 rounded-full bg-white/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-primary rounded-full" />
              </div>
              <div>
                <CardTitle className="text-base">Bayt Beirut Guide</CardTitle>
                <p className="text-xs text-primary-foreground/80">Uses local place data + memory</p>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 text-primary-foreground hover:bg-white/20 rounded-full"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <X className="h-6 w-6" />
            </Button>
          </CardHeader>

          <CardContent className="p-0 flex-1 bg-muted/30 overflow-hidden">
            {preferences.length > 0 && (
              <div className="border-b bg-background px-4 py-2">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <Brain className="h-4 w-4 shrink-0 text-primary" />
                  {preferences.map((preference) => (
                    <span
                      key={preference}
                      className="shrink-0 rounded-full bg-muted px-2 py-1 text-xs font-semibold capitalize text-muted-foreground"
                    >
                      {preference}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="h-full overflow-y-auto p-4">
              <div className="flex flex-col gap-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                        msg.sender === "user"
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-white dark:bg-card border shadow-sm rounded-bl-none"
                      }`}
                    >
                      {msg.sender === "bot" && (
                        <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-primary">
                          <Bot className="h-3 w-3" />
                          Bayt Beirut assistant
                        </div>
                      )}
                      <div className="whitespace-pre-line leading-6">{msg.text}</div>
                      <span
                        className={`text-[10px] block mt-1 opacity-70 ${
                          msg.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-card border shadow-sm rounded-2xl rounded-bl-none px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}

                {messages.length === 1 && !isLoading && (
                  <div className="mt-4 flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground text-center mb-2">Quick questions</p>
                    {quickOptions.map((option) => (
                      <Button
                        key={option}
                        onClick={() => sendMessage(option)}
                        variant="outline"
                        className="justify-start text-left h-auto py-3 px-3 text-xs font-medium rounded-lg"
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-3 bg-background border-t">
            <form onSubmit={handleSubmit} className="flex w-full gap-2">
              <Input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Ask where to go in Lebanon..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
