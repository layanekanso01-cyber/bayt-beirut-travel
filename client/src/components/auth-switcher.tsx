import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "signup";

export function AuthSwitcher({ active }: { active: AuthMode }) {
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState<AuthMode>(active);

  useEffect(() => {
    setSelected(active);
  }, [active]);

  const options: Array<{ mode: AuthMode; label: string; href: string }> = [
    { mode: "login", label: "Sign In", href: "/login" },
    { mode: "signup", label: "Sign Up", href: "/signup" },
  ];

  return (
    <div className="relative mb-5 grid grid-cols-2 overflow-hidden rounded-xl bg-muted p-1">
      <motion.div
        className="absolute bottom-1 top-1 rounded-lg bg-primary shadow-sm"
        initial={false}
        animate={{ x: selected === "login" ? "0%" : "100%" }}
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
        style={{ left: 4, width: "calc(50% - 4px)" }}
      />

      {options.map((option) => {
        const isActive = option.mode === selected;
        return (
          <button
            key={option.mode}
            type="button"
            onClick={() => {
              setSelected(option.mode);
              window.setTimeout(() => navigate(option.href), 180);
            }}
            className={cn(
              "relative z-10 h-14 rounded-lg text-base font-bold transition-colors duration-200",
              isActive ? "text-primary-foreground" : "text-foreground hover:text-primary"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
