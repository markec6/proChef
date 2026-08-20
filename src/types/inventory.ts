import type { Inventory, LocationCode, Product } from "@/types/database";

export type InventoryStatus = "OPTIMAL" | "WARNING" | "CRITICAL";

export type ItemCategory =
  | "ALL"
  | "MEAT"
  | "VEGETABLES"
  | "FRUIT"
  | "BEVERAGES"
  | "DAIRY"
  | "DRY_GOODS";

export interface CategoryMeta {
  id: ItemCategory;
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  iconName: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  brand: string | null;
  unit: string;
  current_stock: number;
  min_stock: number;
  location_id: string;
  status: InventoryStatus;
  category: ItemCategory;
}

export type InventoryProduct = Pick<
  Product,
  "id" | "name" | "brand" | "unit"
> & {
  category: string | null;
};

export type InventoryWithProduct = Pick<
  Inventory,
  "id" | "location_id" | "current_stock" | "min_stock"
> & {
  products: InventoryProduct | InventoryProduct[] | null;
};

const STOCK_CATEGORIES: Exclude<ItemCategory, "ALL">[] = [
  "MEAT",
  "VEGETABLES",
  "FRUIT",
  "BEVERAGES",
  "DAIRY",
  "DRY_GOODS",
];

export function parseItemCategory(
  value: string | null | undefined
): Exclude<ItemCategory, "ALL"> {
  if (
    value &&
    STOCK_CATEGORIES.includes(value as Exclude<ItemCategory, "ALL">)
  ) {
    return value as Exclude<ItemCategory, "ALL">;
  }

  return "DRY_GOODS";
}

export function getInventoryStatus(
  currentStock: number,
  minStock: number
): InventoryStatus {
  if (currentStock <= minStock) {
    return "CRITICAL";
  }

  if (currentStock <= minStock * 1.2) {
    return "WARNING";
  }

  return "OPTIMAL";
}

export function formatStockValue(value: number) {
  return new Intl.NumberFormat("sr-RS", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 2,
  }).format(value);
}

export function mapInventoryRow(row: InventoryWithProduct): InventoryItem | null {
  const product = Array.isArray(row.products) ? row.products[0] : row.products;

  if (!product) {
    return null;
  }

  return {
    id: row.id,
    name: product.name,
    brand: product.brand,
    unit: product.unit,
    current_stock: row.current_stock ?? 0,
    min_stock: row.min_stock ?? 0,
    location_id: row.location_id,
    status: getInventoryStatus(row.current_stock ?? 0, row.min_stock ?? 0),
    category: parseItemCategory(product.category),
  };
}

export type { LocationCode };
