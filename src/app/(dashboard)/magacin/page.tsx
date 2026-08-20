"use client";

import { AlertTriangle, PackageSearch } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CategoryFilterModal } from "@/components/inventory/category-filter-modal";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { SmartReorderPanel } from "@/components/inventory/smart-reorder-panel";
import {
  StockUpdateToast,
  type StockUpdateToastData,
} from "@/components/inventory/stock-update-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateInventoryStockWithActivity } from "@/lib/activity/log-activity";
import { getCategoryMeta } from "@/lib/constants/categories";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useLocation } from "@/providers/location-provider";
import {
  formatStockValue,
  getInventoryStatus,
  parseItemCategory,
  type InventoryItem,
  type ItemCategory,
} from "@/types/inventory";

interface InventoryCategoryJoinRow {
  id: string;
  location_id: string;
  current_stock: number;
  min_stock: number;
  products:
    | {
        id: string;
        name: string;
        brand: string | null;
        unit: string;
        categories:
          | {
              name: string | null;
            }
          | Array<{
              name: string | null;
            }>
          | null;
      }
    | Array<{
        id: string;
        name: string;
        brand: string | null;
        unit: string;
        categories:
          | {
              name: string | null;
            }
          | Array<{
              name: string | null;
            }>
          | null;
      }>
    | null;
}

function countByCategory(items: InventoryItem[]): Record<ItemCategory, number> {
  const counts: Record<ItemCategory, number> = {
    ALL: items.length,
    MEAT: 0,
    VEGETABLES: 0,
    FRUIT: 0,
    BEVERAGES: 0,
    DAIRY: 0,
    DRY_GOODS: 0,
  };

  for (const item of items) {
    if (item.category !== "ALL") {
      counts[item.category] += 1;
    }
  }

  return counts;
}

function mapInventoryJoinRow(row: InventoryCategoryJoinRow): InventoryItem | null {
  const product = Array.isArray(row.products) ? row.products[0] : row.products;

  if (!product) {
    return null;
  }

  const category = Array.isArray(product.categories)
    ? product.categories[0]
    : product.categories;

  return {
    id: row.id,
    name: product.name,
    brand: product.brand,
    unit: product.unit,
    current_stock: row.current_stock,
    min_stock: row.min_stock,
    location_id: row.location_id,
    status: getInventoryStatus(row.current_stock, row.min_stock),
    category: parseItemCategory(category?.name),
  };
}

export default function MagacinPage() {
  const supabase = useMemo(() => createClient(), []);
  const { activeLocation, isLoading: isLocationLoading } = useLocation();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categorySelection, setCategorySelection] = useState<{
    locationId: string | null;
    category: ItemCategory;
  }>({
    locationId: null,
    category: "ALL",
  });
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [stockToast, setStockToast] = useState<StockUpdateToastData | null>(
    null
  );
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    let isMounted = true;

    async function loadInventory() {
      if (!activeLocation) {
        setItems([]);
        setIsLoading(isLocationLoading);
        return;
      }

      setIsLoading(true);

      const { data, error } = await supabase
        .from("inventory")
        .select(
          "id, location_id, current_stock, min_stock, products(id, name, brand, unit, categories(name))"
        )
        .eq("location_id", activeLocation.id);

      if (!isMounted) {
        return;
      }

      if (error) {
        setItems([]);
        setIsLoading(false);
        return;
      }

      const mappedRows = ((data ?? []) as unknown as InventoryCategoryJoinRow[])
        .map(mapInventoryJoinRow)
        .filter((item): item is InventoryItem => item !== null);

      setItems(mappedRows);
      setIsLoading(false);
    }

    void loadInventory();

    return () => {
      isMounted = false;
    };
  }, [activeLocation, isLocationLoading, supabase]);

  const selectedCategory =
    categorySelection.locationId === (activeLocation?.id ?? null)
      ? categorySelection.category
      : "ALL";

  const filteredItems = useMemo(() => {
    if (selectedCategory === "ALL") {
      return items;
    }

    return items.filter((item) => item.category === selectedCategory);
  }, [items, selectedCategory]);

  const categoryCounts = useMemo(() => countByCategory(items), [items]);
  const criticalCount = useMemo(
    () => filteredItems.filter((item) => item.status === "CRITICAL").length,
    [filteredItems]
  );
  const selectedMeta = getCategoryMeta(selectedCategory);
  const subtitleLocation = activeLocation?.name ?? "nije izabrana";

  const handleSelectCategory = useCallback((category: ItemCategory) => {
    setCategorySelection({
      locationId: activeLocation?.id ?? null,
      category,
    });
    setIsCategoryModalOpen(false);
  }, [activeLocation?.id]);

  const dismissStockToast = useCallback(() => {
    setStockToast(null);
  }, []);

  const handleStockUpdate = useCallback(
    async (item: InventoryItem, newStock: number) => {
      const previousItems = itemsRef.current;
      const updateItem = (currentItem: InventoryItem): InventoryItem =>
        currentItem.id === item.id
          ? {
              ...currentItem,
              current_stock: newStock,
              status: getInventoryStatus(newStock, currentItem.min_stock),
            }
          : currentItem;

      setItems((currentItems) => currentItems.map(updateItem));

      const successMessage = `Zalihe uspešno ažurirane: ${item.name} -> ${formatStockValue(
        newStock
      )} ${item.unit}`;

      if (!activeLocation) {
        setItems(previousItems);
        setStockToast({
          id: `${item.id}-${Date.now()}`,
          title: "Izmena nije sačuvana",
          description: "Nije izabrana aktivna lokacija.",
          type: "error",
        });
        return;
      }

      try {
        await updateInventoryStockWithActivity(
          {
            inventoryId: item.id,
            newStock,
            details: `Količina promenjena sa ${formatStockValue(
              item.current_stock
            )} ${item.unit} na ${formatStockValue(newStock)} ${
              item.unit
            } na lokaciji ${activeLocation.name}`,
          },
          supabase
        );
      } catch (error) {
        setItems(previousItems);
        setStockToast({
          id: `${item.id}-${Date.now()}`,
          title: "Izmena nije sačuvana",
          description: "Vraćeno je prethodno stanje zaliha.",
          type: "error",
        });
        throw error;
      }

      setStockToast({
        id: `${item.id}-${Date.now()}`,
        title: "Stanje uspešno ažurirano",
        description: successMessage,
        type: "success",
      });
    },
    [activeLocation, supabase]
  );

  return (
    <div className="flex w-full flex-col gap-3 p-6">
      <StockUpdateToast toast={stockToast} onDismiss={dismissStockToast} />

      <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
            <PackageSearch className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Magacin i Zalihe
            </h1>
            <p className="text-sm text-muted-foreground">
              Pregled trenutnog stanja po lokaciji: {subtitleLocation}
            </p>
          </div>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto lg:min-w-[36rem]">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className={cn(
              "rounded-xl border p-4 text-left transition-colors",
              selectedMeta.bgClass,
              selectedMeta.textClass,
              selectedMeta.borderClass
            )}
          >
            <div className="text-[11px] font-semibold tracking-wider uppercase">
              Kategorija / Sorta
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  "border bg-white/80 font-semibold",
                  selectedMeta.textClass,
                  selectedMeta.borderClass
                )}
              >
                {selectedMeta.label}
              </Badge>
            </div>
            <div className="mt-2 text-xs opacity-80">Kliknite za promenu</div>
          </button>

          <Card size="sm" className="gap-2">
            <CardHeader>
              <CardDescription>Ukupno artikala</CardDescription>
              <CardTitle className="text-2xl">{filteredItems.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card size="sm" className="gap-2">
            <CardHeader>
              <CardDescription>Kritično stanje</CardDescription>
              <CardTitle className="flex items-center gap-2 text-2xl">
                {criticalCount}
                <Badge
                  variant="destructive"
                  className="gap-1 bg-red-500/10 text-red-700 dark:text-red-300"
                >
                  <AlertTriangle className="size-3" aria-hidden="true" />
                  Kritično
                </Badge>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>

      <InventoryTable
        data={filteredItems}
        isLoading={isLoading || isLocationLoading}
        resetKey={`${activeLocation?.id ?? "none"}-${selectedCategory}`}
        onStockUpdate={handleStockUpdate}
      />

      <SmartReorderPanel
        items={items}
        locationName={subtitleLocation}
        isLoading={isLoading || isLocationLoading}
        onToast={setStockToast}
      />

      <CategoryFilterModal
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        categoryCounts={categoryCounts}
      />
    </div>
  );
}
