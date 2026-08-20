"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

const AUTH_TABS = [
  { href: "/login", label: "Prijava" },
  { href: "/register", label: "Registracija" },
] as const;

export function AuthTabs() {
  const pathname = usePathname();

  return (
    <div
      className="relative mb-8 grid grid-cols-2 rounded-xl bg-muted p-1"
      role="tablist"
      aria-label="Prijava ili registracija"
    >
      {AUTH_TABS.map((tab) => {
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "relative z-10 rounded-lg px-3 py-2.5 text-center text-sm font-medium transition-colors",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="auth-tab-indicator"
                className="absolute inset-0 rounded-lg bg-background shadow-sm"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            ) : null}
            <span className="relative z-10">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
