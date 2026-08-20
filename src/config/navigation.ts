import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ClipboardList,
  LayoutDashboard,
  PackageSearch,
  Receipt,
} from "lucide-react";

import { getRoleLabel, ROLE_LABELS } from "@/lib/constants/roles";
import type { UserRole } from "@/types/database";

export { getRoleLabel, ROLE_LABELS };

export interface NavigationItem {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
  allowedRoles: UserRole[];
}

const ALL_ROLES: UserRole[] = [
  "ADMIN",
  "KUVAR",
  "NUTRICIONISTA",
  "MAGACIONER",
];

export const DASHBOARD_NAVIGATION: NavigationItem[] = [
  {
    title: "Pregled",
    href: "/",
    description: "Dashboard i ključni pokazatelji",
    icon: LayoutDashboard,
    allowedRoles: ALL_ROLES,
  },
  {
    title: "Obrasci & nalozi",
    href: "/obrasci",
    description: "Digitalni obrasci za rad i štampu",
    icon: ClipboardList,
    allowedRoles: ALL_ROLES,
  },
  {
    title: "Magacin",
    href: "/magacin",
    description: "Stanje i pretraga zaliha",
    icon: PackageSearch,
    allowedRoles: ALL_ROLES,
  },
  // Temporarily hidden until the pages are implemented:
  // {
  //   title: "Istorija utroška",
  //   href: "/utrosak",
  //   description: "Evidencija skidanja sa zaliha",
  //   icon: History,
  //   allowedRoles: ALL_ROLES,
  // },
  // {
  //   title: "Izveštaji",
  //   href: "/izvestaji",
  //   description: "Analitika i izvoz podataka",
  //   icon: FileSpreadsheet,
  //   allowedRoles: ALL_ROLES,
  // },
  {
    title: "Evidencija aktivnosti",
    href: "/evidencija",
    description: "Dnevnik izmena, unosa i štampe",
    icon: Activity,
    allowedRoles: ALL_ROLES,
  },
  {
    title: "Fakture & Obračuni",
    href: "/fakture",
    description: "Fakture, potraživanja i obračuni",
    icon: Receipt,
    allowedRoles: ALL_ROLES,
  },
];

export function getNavigationForRole(_role?: UserRole | null) {
  return DASHBOARD_NAVIGATION;
}
