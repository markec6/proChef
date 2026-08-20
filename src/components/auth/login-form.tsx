"use client";

import { Loader2, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";

export function LoginForm() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setIsSubmitting(true);
    setActionMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setActionMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    await refreshProfile();
    router.replace("/");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Prijavite se u proChef
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Unesite nalog da biste otvorili dashboard i aktivnu lokaciju.
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handleLogin();
        }}
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium">Email</span>
          <span className="relative block">
            <Mail
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="email"
              placeholder="email@prochef.rs"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="h-11 pl-9"
              required
            />
          </span>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Lozinka</span>
          <span className="relative block">
            <LockKeyhole
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="password"
              placeholder="Lozinka"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="h-11 pl-9"
              required
            />
          </span>
        </label>

        {actionMessage ? (
          <p className="text-sm text-destructive">{actionMessage}</p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700"
          disabled={isSubmitting || !email || !password}
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          Prijavi se
        </Button>
      </form>
    </div>
  );
}
