"use client";

import { Activity } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ActivityFeed } from "@/components/evidencija/activity-feed";
import {
  ActivityFiltersBar,
  type ActivityUserOption,
} from "@/components/evidencija/activity-filters";
import {
  ActivityMetrics,
  type ActivityMetricsData,
} from "@/components/evidencija/activity-metrics";
import {
  ActivityPagination,
  type ActivityPageSize,
} from "@/components/evidencija/activity-pagination";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast, Toaster } from "@/components/ui/toast";
import {
  deleteActivityLogs,
  fetchActivityLogs,
} from "@/lib/activity/format-activity";
import {
  DEFAULT_ACTIVITY_FILTERS,
  getBelgradeDayRange,
  getDateRangeForPreset,
  isTimestampInRange,
  type ActivityFilters,
} from "@/lib/constants/activity";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import type { ActivityLog } from "@/types/database";

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase("sr-RS");
}

function getActivityMetrics(logs: ActivityLog[]): ActivityMetricsData {
  const todayRange = getBelgradeDayRange();
  const todayLogs = logs.filter((log) =>
    isTimestampInRange(log.created_at, todayRange)
  );

  return {
    todayCount: todayLogs.length,
    magacinStockCount: logs.filter(
      (log) =>
        log.module === "Magacin" &&
        (log.action === "CREATE" || log.action === "UPDATE")
    ).length,
    printCount: logs.filter((log) => log.action === "PRINT").length,
    activeUsersToday: new Set(todayLogs.map((log) => log.user_id)).size,
  };
}

export default function EvidencijaPage() {
  const supabase = useMemo(() => createClient(), []);
  const { profile } = useAuth();
  const isAdmin = profile?.role === "ADMIN";
  const [filters, setFilters] = useState<ActivityFilters>(DEFAULT_ACTIVITY_FILTERS);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(
    () => new Set()
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ActivityPageSize>(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadLogs = useCallback(
    async (showRefreshState = false) => {
      if (showRefreshState) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const range = getDateRangeForPreset(filters.datePreset);
        const nextLogs = await fetchActivityLogs(range, supabase);
        setLogs(nextLogs);
        setSelectedLogIds(new Set());
        setErrorMessage(null);
      } catch (error) {
        console.error("Failed to load activity logs:", error);
        setLogs([]);
        setSelectedLogIds(new Set());
        setErrorMessage("Evidencija nije učitana. Pokušajte ponovo.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filters.datePreset, supabase]
  );

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const users = useMemo<ActivityUserOption[]>(() => {
    const uniqueUsers = new Map<string, string>();

    for (const log of logs) {
      if (!uniqueUsers.has(log.user_id)) {
        uniqueUsers.set(log.user_id, log.user_name);
      }
    }

    return [...uniqueUsers.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name, "sr"));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const search = normalizeSearch(filters.search);

    return logs.filter((log) => {
      if (filters.userId !== "all" && log.user_id !== filters.userId) {
        return false;
      }

      if (filters.module !== "all" && log.module !== filters.module) {
        return false;
      }

      if (filters.action !== "all" && log.action !== filters.action) {
        return false;
      }

      if (!search) {
        return true;
      }

      return (
        normalizeSearch(log.target_item).includes(search) ||
        normalizeSearch(log.details).includes(search) ||
        normalizeSearch(log.user_name).includes(search)
      );
    });
  }, [filters.action, filters.module, filters.search, filters.userId, logs]);

  const metrics = useMemo(() => getActivityMetrics(logs), [logs]);

  useEffect(() => {
    setPage(1);
  }, [filters, pageSize]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredLogs.length / pageSize)),
    [filteredLogs.length, pageSize]
  );
  const currentPage = Math.min(page, totalPages);
  const paginatedLogs = useMemo(
    () =>
      filteredLogs.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
      ),
    [currentPage, filteredLogs, pageSize]
  );
  const selectedCount = selectedLogIds.size;

  const toggleSelect = useCallback((id: string) => {
    setSelectedLogIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }, []);

  const handleDeleteClick = () => {
    if (selectedCount === 0) {
      toast.add({
        type: "warning",
        title: "Niste izabrali nijednu evidenciju za brisanje.",
      });
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    const idsToDelete = [...selectedLogIds];

    if (idsToDelete.length === 0) {
      setIsConfirmOpen(false);
      return;
    }

    setIsDeleting(true);

    try {
      await deleteActivityLogs(idsToDelete, supabase);
      const deletedIds = new Set(idsToDelete);
      setLogs((current) => current.filter((log) => !deletedIds.has(log.id)));
      setSelectedLogIds(new Set());
      setIsConfirmOpen(false);
      toast.add({
        type: "success",
        title: `Uspešno obrisano ${idsToDelete.length} evidencija.`,
      });
    } catch (error) {
      console.error("Failed to delete activity logs:", error);
      toast.add({
        type: "error",
        title: "Greška pri brisanju evidencije.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Toaster>
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
            <Activity className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Evidencija aktivnosti
            </h1>
            <p className="text-sm text-muted-foreground">
              Pregled unosa, izmena, brisanja i štampe po korisniku i modulu.
            </p>
          </div>
        </div>

        <ActivityMetrics metrics={metrics} isLoading={isLoading} />

        <ActivityFiltersBar
          filters={filters}
          users={users}
          showUserFilter={isAdmin}
          isRefreshing={isRefreshing}
          isDeleting={isDeleting}
          onFiltersChange={setFilters}
          onRefresh={() => void loadLogs(true)}
          onDelete={handleDeleteClick}
        />

        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}

        <ActivityFeed
          key={currentPage}
          logs={paginatedLogs}
          isLoading={isLoading}
          selectedLogIds={selectedLogIds}
          onToggleSelect={toggleSelect}
        />
        <ActivityPagination
          page={currentPage}
          pageSize={pageSize}
          totalItems={filteredLogs.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />

        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Obriši evidenciju</DialogTitle>
              <DialogDescription>
                Da li ste sigurni da želite da obrišete {selectedCount} evidencija?
                Ova radnja je trajna.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isDeleting}
              >
                Odustani
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleConfirmDelete()}
                disabled={isDeleting}
              >
                Obriši
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Toaster>
  );
}
