import type { CategoryMeta, ItemCategory } from "@/types/inventory";

export const CATEGORY_META: Record<ItemCategory, CategoryMeta> = {
  ALL: {
    id: "ALL",
    label: "Sve kategorije",
    bgClass: "bg-slate-100 hover:bg-slate-200",
    textClass: "text-slate-800",
    borderClass: "border-slate-200",
    iconName: "LayoutGrid",
  },
  MEAT: {
    id: "MEAT",
    label: "Meso i prerađevine",
    bgClass: "bg-rose-50 hover:bg-rose-100",
    textClass: "text-rose-700",
    borderClass: "border-rose-200",
    iconName: "Beef",
  },
  VEGETABLES: {
    id: "VEGETABLES",
    label: "Povrće",
    bgClass: "bg-emerald-50 hover:bg-emerald-100",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-200",
    iconName: "Carrot",
  },
  FRUIT: {
    id: "FRUIT",
    label: "Voće",
    bgClass: "bg-amber-50 hover:bg-amber-100",
    textClass: "text-amber-700",
    borderClass: "border-amber-200",
    iconName: "Apple",
  },
  BEVERAGES: {
    id: "BEVERAGES",
    label: "Pića i napitci",
    bgClass: "bg-sky-50 hover:bg-sky-100",
    textClass: "text-sky-700",
    borderClass: "border-sky-200",
    iconName: "CupSoda",
  },
  DAIRY: {
    id: "DAIRY",
    label: "Mlečni proizvodi",
    bgClass: "bg-indigo-50 hover:bg-indigo-100",
    textClass: "text-indigo-700",
    borderClass: "border-indigo-200",
    iconName: "Milk",
  },
  DRY_GOODS: {
    id: "DRY_GOODS",
    label: "Suvi artikli i začini",
    bgClass: "bg-purple-50 hover:bg-purple-100",
    textClass: "text-purple-700",
    borderClass: "border-purple-200",
    iconName: "Wheat",
  },
};

export const CATEGORY_ORDER: ItemCategory[] = [
  "ALL",
  "MEAT",
  "VEGETABLES",
  "FRUIT",
  "DAIRY",
  "DRY_GOODS",
  "BEVERAGES",
];

export function getCategoryMeta(category: ItemCategory): CategoryMeta {
  return CATEGORY_META[category];
}
