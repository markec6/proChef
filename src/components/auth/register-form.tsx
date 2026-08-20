"use client";

import { Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { RoleCardGrid } from "@/components/auth/role-card-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isUserRole } from "@/lib/constants/roles";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import type { UserRole } from "@/types/database";

export function RegisterForm() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupRole, setSignupRole] = useState<UserRole | "">("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async () => {
    if (!isUserRole(signupRole)) {
      setActionMessage("Izaberite ulogu za novi nalog.");
      return;
    }

    setIsSubmitting(true);
    setActionMessage(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim() || email.split("@")[0] || "Zaposleni",
          role: signupRole,
        },
      },
    });

    if (error) {
      setActionMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    await refreshProfile();

    if (data.session) {
      router.replace("/");
      return;
    }

    setActionMessage(
      "Registracija uspešna. Ako je email potvrda uključena, proverite inbox pa se prijavite."
    );
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Kreirajte nalog
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Izaberite ulogu i otvorite pristup modulima koji vam trebaju.
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSignUp();
        }}
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium">Ime i prezime</span>
          <span className="relative block">
            <UserRound
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="text"
              placeholder="npr. Ana Petrović"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              className="h-11 pl-9"
            />
          </span>
        </label>

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
              placeholder="Najmanje 6 karaktera"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              className="h-11 pl-9"
              required
              minLength={6}
            />
          </span>
        </label>

        <div className="space-y-2">
          <p className="text-sm font-medium">Uloga</p>
          <RoleCardGrid value={signupRole} onChange={setSignupRole} />
        </div>

        {actionMessage ? (
          <p className="text-sm text-muted-foreground">{actionMessage}</p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700"
          disabled={isSubmitting || !email || !password || !signupRole}
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          Registruj nalog
        </Button>
      </form>
    </div>
  );
}
