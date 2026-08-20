"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const ACTIVITY_PAGE_SIZES = [10, 25, 50] as const;
export type ActivityPageSize = (typeof ACTIVITY_PAGE_SIZES)[number];

function getVisiblePages(current: number, total: number) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= total)
    .sort((left, right) => left - right);

  const visible: Array<number | "ellipsis"> = [];

  for (const page of sorted) {
    const previous = visible[visible.length - 1];
    if (typeof previous === "number" && page - previous > 1) {
      visible.push("ellipsis");
    }
    visible.push(page);
  }

  return visible;
}

export function ActivityPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: ActivityPageSize;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: ActivityPageSize) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalItems);
  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Prikazano {rangeStart}-{rangeEnd} od {totalItems} aktivnosti
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={String(pageSize)}
          onValueChange={(value) => {
            if (value === "10" || value === "25" || value === "50") {
              onPageSizeChange(Number(value) as ActivityPageSize);
            }
          }}
        >
          <SelectTrigger className="h-8 min-w-[8.5rem]">
            <SelectValue>{`Prikaži ${pageSize}`}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                Prikaži {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            Prethodna
          </Button>

          {visiblePages.map((item, index) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="px-1 text-sm text-muted-foreground"
              >
                ...
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                variant={item === currentPage ? "default" : "outline"}
                size="icon-sm"
                className={cn(
                  item === currentPage &&
                    "bg-emerald-600 text-white hover:bg-emerald-700"
                )}
                onClick={() => onPageChange(item)}
                aria-current={item === currentPage ? "page" : undefined}
              >
                {item}
              </Button>
            )
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages || totalItems === 0}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Sledeća
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
