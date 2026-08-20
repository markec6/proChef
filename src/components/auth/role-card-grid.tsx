"use client";

import { ROLE_OPTIONS } from "@/lib/constants/roles";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

interface RoleCardGridProps {
  value: UserRole | "";
  onChange: (role: UserRole) => void;
}

export function RoleCardGrid({ value, onChange }: RoleCardGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {ROLE_OPTIONS.map((role) => {
        const Icon = role.icon;
        const isSelected = value === role.value;

        return (
          <button
            key={role.value}
            type="button"
            onClick={() => onChange(role.value)}
            aria-pressed={isSelected}
            className={cn(
              "rounded-2xl border bg-card p-4 text-left transition-all hover:border-emerald-400/70 hover:shadow-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              isSelected
                ? "border-emerald-500 bg-emerald-50 shadow-sm ring-3 ring-emerald-500/15"
                : "border-border"
            )}
          >
            <span
              className={cn(
                "mb-3 flex size-10 items-center justify-center rounded-xl",
                isSelected
                  ? "bg-emerald-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className="block text-sm font-semibold">{role.label}</span>
            <span className="mt-0.5 block text-xs font-medium text-emerald-700">
              {role.subtitle}
            </span>
            <span className="mt-2 block text-xs leading-5 text-muted-foreground">
              {role.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
