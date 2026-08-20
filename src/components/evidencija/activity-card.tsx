"use client";

import { memo } from "react";
import { ShieldCheck, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ACTIVITY_ACTIONS } from "@/lib/constants/activity";
import {
  formatActivityTimestamp,
  parseActivityDetails,
} from "@/lib/activity/format-activity";
import { getRoleLabel } from "@/lib/constants/roles";
import { cn } from "@/lib/utils";
import type { ActivityLog } from "@/types/database";

export const ActivityCard = memo(function ActivityCard({
  log,
  selected,
  onToggleSelect,
}: {
  log: ActivityLog;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const action = ACTIVITY_ACTIONS[log.action];
  const ActionIcon = action.icon;
  const isAdmin = log.user_role === "ADMIN";

  return (
    <article
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-sm transition-colors",
        selected ? "border-sky-300 bg-sky-50/60" : "border-border"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
              action.className
            )}
          >
            <ActionIcon className="size-3.5" aria-hidden="true" />
            {action.label}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{log.user_name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                {isAdmin ? (
                  <ShieldCheck className="size-3" aria-hidden="true" />
                ) : (
                  <UserRound className="size-3" aria-hidden="true" />
                )}
                {getRoleLabel(log.user_role)}
              </Badge>
              <Badge variant="outline">{log.module}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <time
            dateTime={log.created_at}
            className="text-xs font-medium text-muted-foreground"
          >
            {formatActivityTimestamp(log.created_at)}
          </time>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(log.id)}
            aria-label={`Izaberi evidenciju ${log.target_item}`}
            className="size-4 shrink-0 cursor-pointer rounded border-border accent-sky-600"
          />
        </div>
      </div>

      <p className="mt-3 text-sm font-medium">{log.target_item}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        {parseActivityDetails(log.details).map((segment, index) =>
          segment.emphasize ? (
            <span
              key={`${log.id}-${index}`}
              className="font-semibold text-foreground"
            >
              {segment.text}
            </span>
          ) : (
            <span key={`${log.id}-${index}`}>{segment.text}</span>
          )
        )}
      </p>
    </article>
  );
});
