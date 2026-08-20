"use client";

import {
  Apple,
  Beef,
  Carrot,
  CupSoda,
  LayoutGrid,
  Milk,
  Wheat,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/constants/categories";
import { cn } from "@/lib/utils";
import type { ItemCategory } from "@/types/inventory";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Apple,
  Beef,
  Carrot,
  CupSoda,
  LayoutGrid,
  Milk,
  Wheat,
};

interface CategoryFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCategory: ItemCategory;
  onSelectCategory: (category: ItemCategory) => void;
  categoryCounts: Record<ItemCategory, number>;
}

export function CategoryFilterModal({
  open,
  onOpenChange,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}: CategoryFilterModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Izaberite kategoriju artikala</DialogTitle>
          <DialogDescription>
            Filtrirajte magacin po sorti namirnica za aktivnu lokaciju.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CATEGORY_ORDER.map((categoryId) => {
            const meta = CATEGORY_META[categoryId];
            const Icon = CATEGORY_ICONS[meta.iconName] ?? LayoutGrid;
            const isSelected = selectedCategory === categoryId;
            const count = categoryCounts[categoryId] ?? 0;

            return (
              <button
                key={categoryId}
                type="button"
                onClick={() => onSelectCategory(categoryId)}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                  meta.bgClass,
                  meta.textClass,
                  meta.borderClass,
                  isSelected && "ring-2 ring-ring ring-offset-2"
                )}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg border bg-white/70",
                    meta.borderClass
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="space-y-1">
                  <span className="block text-sm font-semibold leading-snug">
                    {meta.label}
                  </span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "border bg-white/80 font-medium",
                      meta.textClass,
                      meta.borderClass
                    )}
                  >
                    {count}
                  </Badge>
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
