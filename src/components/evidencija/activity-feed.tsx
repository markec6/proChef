"use client";

import { History } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { ActivityCard } from "@/components/evidencija/activity-card";
import type { ActivityLog } from "@/types/database";

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex justify-between gap-3">
            <div className="flex gap-3">
              <div className="h-6 w-24 rounded-full bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-muted" />
                <div className="h-4 w-28 rounded bg-muted" />
              </div>
            </div>
            <div className="h-4 w-36 rounded bg-muted" />
          </div>
          <div className="mt-4 h-4 w-2/3 rounded bg-muted" />
          <div className="mt-2 h-4 w-full rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function ActivityFeed({
  logs,
  isLoading,
  selectedLogIds,
  onToggleSelect,
}: {
  logs: ActivityLog[];
  isLoading: boolean;
  selectedLogIds: Set<string>;
  onToggleSelect: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="gpu-scroll max-h-[640px] overflow-y-auto pr-2">
        <ActivitySkeleton />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex max-h-[640px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <History className="size-5" aria-hidden="true" />
        </span>
        <p className="font-medium">Nema zabeleženih aktivnosti</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Promenite filtere ili osvežite evidenciju. Novi unosi, izmene i štampa
          naloga pojaviće se ovde.
        </p>
      </div>
    );
  }

  return (
    <div className="gpu-scroll max-h-[640px] overflow-y-auto pr-2">
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <ActivityCard
                log={log}
                selected={selectedLogIds.has(log.id)}
                onToggleSelect={onToggleSelect}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
