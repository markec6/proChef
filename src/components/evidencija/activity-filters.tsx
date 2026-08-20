"use client";

import { Filter, Loader2, RefreshCw, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACTIVITY_ACTION_OPTIONS,
  ACTIVITY_DATE_PRESETS,
  ACTIVITY_MODULES,
  type ActivityFilters,
} from "@/lib/constants/activity";
import { cn } from "@/lib/utils";
import type { ActivityAction, ActivityModule } from "@/types/database";

export interface ActivityUserOption {
  id: string;
  name: string;
}

interface ActivityFiltersProps {
  filters: ActivityFilters;
  users: ActivityUserOption[];
  showUserFilter: boolean;
  isRefreshing: boolean;
  isDeleting: boolean;
  onFiltersChange: (filters: ActivityFilters) => void;
  onRefresh: () => void;
  onDelete: () => void;
}

export function ActivityFiltersBar({
  filters,
  users,
  showUserFilter,
  isRefreshing,
  isDeleting,
  onFiltersChange,
  onRefresh,
  onDelete,
}: ActivityFiltersProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="size-4 text-muted-foreground" aria-hidden="true" />
          Filteri evidencije
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing || isDeleting}
          >
            <RefreshCw
              className={cn("size-3.5", isRefreshing && "animate-spin")}
              aria-hidden="true"
            />
            Osveži
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="size-3.5" aria-hidden="true" />
            )}
            Obriši
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {ACTIVITY_DATE_PRESETS.map((preset) => {
          const isActive = filters.datePreset === preset.value;

          return (
            <button
              key={preset.value}
              type="button"
              onClick={() =>
                onFiltersChange({ ...filters, datePreset: preset.value })
              }
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {showUserFilter ? (
          <Select
            value={filters.userId}
            onValueChange={(value) => {
              if (typeof value === "string") {
                onFiltersChange({ ...filters, userId: value });
              }
            }}
          >
            <SelectTrigger className="h-10 w-full min-w-0">
              <SelectValue placeholder="Svi korisnici">
                {filters.userId === "all"
                  ? "Svi korisnici"
                  : (users.find((user) => user.id === filters.userId)?.name ??
                    "Svi korisnici")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Svi korisnici</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <Select
          value={filters.module}
          onValueChange={(value) => {
            if (value === "all" || ACTIVITY_MODULES.includes(value as ActivityModule)) {
              onFiltersChange({
                ...filters,
                module: value as ActivityModule | "all",
              });
            }
          }}
        >
          <SelectTrigger className="h-10 w-full min-w-0">
            <SelectValue placeholder="Svi moduli">
              {filters.module === "all" ? "Svi moduli" : filters.module}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Svi moduli</SelectItem>
            {ACTIVITY_MODULES.map((module) => (
              <SelectItem key={module} value={module}>
                {module}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.action}
          onValueChange={(value) => {
            if (
              value === "all" ||
              value === "CREATE" ||
              value === "UPDATE" ||
              value === "DELETE" ||
              value === "PRINT"
            ) {
              onFiltersChange({
                ...filters,
                action: value as ActivityAction | "all",
              });
            }
          }}
        >
          <SelectTrigger className="h-10 w-full min-w-0">
            <SelectValue placeholder="Sve akcije">
              {filters.action === "all"
                ? "Sve akcije"
                : ACTIVITY_ACTION_OPTIONS.find(
                    (action) => action.value === filters.action
                  )?.filterLabel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Sve akcije</SelectItem>
            {ACTIVITY_ACTION_OPTIONS.map((action) => (
              <SelectItem key={action.value} value={action.value}>
                {action.filterLabel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={filters.search}
            onChange={(event) =>
              onFiltersChange({ ...filters, search: event.target.value })
            }
            placeholder="Pretraga artikla ili detalja"
            className="h-10 pl-9"
          />
        </div>
      </div>
    </div>
  );
}
