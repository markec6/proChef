"use client";

import { Loader2, LockKeyhole } from "lucide-react";
import { motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  clearPinVerified,
  getAppPin,
  isAuthPinRoute,
  readPinVerified,
  writePinVerified,
} from "@/lib/constants/pin";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

const PIN_ERROR_MESSAGE = "Netačan kôd pristupa. Pokušajte ponovo.";

export function PinGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, signOut } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [pin, setPin] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    setIsVerified(readPinVerified());
    setIsStorageReady(true);
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      clearPinVerified();
      setIsVerified(false);
      setPin("");
      setErrorMessage(null);
    }
  }, [isLoading, user]);

  const isAuthRoute = isAuthPinRoute(pathname);
  const shouldGate =
    !isAuthRoute &&
    (!isStorageReady || (!isVerified && (isLoading || Boolean(user))));

  useEffect(() => {
    if (!shouldGate) {
      return;
    }

    inputRef.current?.focus();
  }, [shouldGate]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (pin.trim() === getAppPin()) {
      writePinVerified();
      setIsVerified(true);
      setPin("");
      setErrorMessage(null);
      return;
    }

    setErrorMessage(PIN_ERROR_MESSAGE);
    setShakeKey((current) => current + 1);
    setPin("");
    inputRef.current?.focus();
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    clearPinVerified();
    setIsVerified(false);
    router.replace("/login");
    setIsSigningOut(false);
  };

  return (
    <>
      {children}
      {shouldGate ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
          role="presentation"
          onMouseDown={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <motion.div
            key={shakeKey}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pin-gate-title"
            aria-describedby={errorMessage ? errorId : "pin-gate-description"}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={
              errorMessage
                ? { opacity: 1, scale: 1, x: [0, -8, 8, -6, 6, 0] }
                : { opacity: 1, scale: 1, x: 0 }
            }
            transition={{ duration: errorMessage ? 0.35 : 0.18 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_46%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_40%)]"
            />

            <div className="relative space-y-6">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30">
                  <LockKeyhole className="size-5 text-white" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="pin-gate-title"
                    className="text-lg font-semibold tracking-tight text-white"
                  >
                    Kôd pristupa kuhinji / objektu
                  </h2>
                  <p
                    id="pin-gate-description"
                    className="mt-1 text-sm text-slate-300"
                  >
                    Unesite kôd da otvorite radni prostor. Sesija ostaje
                    aktivna, ali kôd se traži ponovo nakon zatvaranja kartice.
                  </p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-200">
                    Kôd pristupa
                  </span>
                  <Input
                    ref={inputRef}
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    autoFocus
                    maxLength={6}
                    value={pin}
                    onChange={(event) => {
                      setPin(event.target.value);
                      if (errorMessage) {
                        setErrorMessage(null);
                      }
                    }}
                    aria-invalid={errorMessage ? true : undefined}
                    aria-describedby={errorMessage ? errorId : undefined}
                    className={cn(
                      "h-12 bg-white/5 text-center text-lg tracking-[0.4em] text-white placeholder:tracking-normal placeholder:text-slate-400",
                      errorMessage &&
                        "border-red-400 ring-3 ring-red-400/30 focus-visible:border-red-400 focus-visible:ring-red-400/40"
                    )}
                    placeholder="••••••"
                    required
                  />
                </label>

                {errorMessage ? (
                  <p id={errorId} className="text-sm text-red-300" role="alert">
                    {errorMessage}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={isSigningOut || pin.trim().length === 0}
                >
                  Potvrdi
                </Button>
              </form>

              <Button
                type="button"
                variant="ghost"
                className="h-10 w-full text-slate-300 hover:bg-white/10 hover:text-white"
                onClick={() => {
                  void handleSignOut();
                }}
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                Odjavi se
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </>
  );
}
