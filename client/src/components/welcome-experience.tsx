import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plane, TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

const animationDurationMs = 5200;

export function WelcomeExperience() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  const firstName = useMemo(() => {
    const displayName = user?.name || user?.username || "traveler";
    return displayName.trim().split(/\s+/)[0] || "traveler";
  }, [user]);

  useEffect(() => {
    if (!user || user.role === "admin") return;

    const storageKey = `lebanon-welcome-seen-${user.id}`;
    if (sessionStorage.getItem(storageKey)) return;

    setIsVisible(true);
    const timer = window.setTimeout(() => {
      sessionStorage.setItem(storageKey, "true");
      setIsVisible(false);
    }, animationDurationMs);

    return () => window.clearTimeout(timer);
  }, [user]);

  function closeWelcome() {
    if (user) {
      sessionStorage.setItem(`lebanon-welcome-seen-${user.id}`, "true");
    }
    setIsVisible(false);
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[80] overflow-hidden bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.65, ease: "easeInOut" }}
        >
          <div className="lebanon-flag-ribbon absolute inset-x-0 top-0 h-2" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--secondary)/0.16),transparent_32%),radial-gradient(circle_at_80%_20%,hsl(var(--primary)/0.13),transparent_30%)]" />

          <motion.div
            className="absolute left-0 top-[32%] flex items-center gap-3"
            initial={{ x: "-24vw", y: 36, rotate: -8 }}
            animate={{ x: "118vw", y: -58, rotate: 8 }}
            transition={{ duration: 3.9, ease: "easeInOut" }}
          >
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((cloud) => (
                <motion.span
                  key={cloud}
                  className="h-3 w-10 rounded-full bg-muted shadow-sm"
                  initial={{ opacity: 0, scaleX: 0.6 }}
                  animate={{ opacity: [0, 0.8, 0], scaleX: [0.6, 1.25, 0.8] }}
                  transition={{
                    duration: 2.4,
                    delay: cloud * 0.18,
                    repeat: Infinity,
                    repeatDelay: 0.3,
                  }}
                />
              ))}
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/25">
              <Plane className="h-8 w-8 rotate-45" />
            </div>
          </motion.div>

          <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-12">
            <motion.div
              className="w-full max-w-2xl text-center"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.65, ease: "easeOut" }}
            >
              <motion.div
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-primary bg-card text-secondary shadow-xl"
                initial={{ scale: 0.85, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.9, duration: 0.55, type: "spring" }}
              >
                <TreePine className="h-10 w-10" />
              </motion.div>

              <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-secondary">
                Your Lebanon journey begins
              </p>
              <h1 className="font-serif text-4xl font-black leading-tight text-foreground sm:text-6xl">
                Welcome to Lebanon, <span className="text-primary">{firstName}</span>!
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
                Ready to explore your next adventure?
              </p>

              <div className="mx-auto mt-8 h-1.5 max-w-xs overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-secondary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: animationDurationMs / 1000 - 0.8, ease: "linear" }}
                />
              </div>

              <Button type="button" variant="outline" className="mt-8 rounded-full bg-card/70" onClick={closeWelcome}>
                Skip animation
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
