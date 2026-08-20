import {
  Briefcase,
  ChefHat,
  Package,
  Salad,
  type LucideIcon,
} from "lucide-react";

import type { UserRole } from "@/types/database";

export const USER_ROLES: UserRole[] = [
  "ADMIN",
  "NUTRICIONISTA",
  "KUVAR",
  "MAGACIONER",
];

export interface RoleCatalogEntry {
  value: UserRole;
  label: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
}

export const ROLE_CATALOG: Record<UserRole, RoleCatalogEntry> = {
  ADMIN: {
    value: "ADMIN",
    label: "Admin",
    subtitle: "Kancelarija / Uprava",
    description: "Upravljanje ugovorima, izveštaji i evidencija",
    icon: Briefcase,
  },
  NUTRICIONISTA: {
    value: "NUTRICIONISTA",
    label: "Nutricionista",
    subtitle: "Planiranje obroka",
    description: "Kreiranje dijetalnih naloga i jelovnika",
    icon: Salad,
  },
  KUVAR: {
    value: "KUVAR",
    label: "Kuvar",
    subtitle: "Kuhinja",
    description: "Kuhinja i dnevna priprema obroka",
    icon: ChefHat,
  },
  MAGACIONER: {
    value: "MAGACIONER",
    label: "Magacioner",
    subtitle: "Upravljanje zaliha",
    description: "Prijem i razduživanje zaliha u magacinu",
    icon: Package,
  },
};

export const ROLE_OPTIONS = USER_ROLES.map((role) => ROLE_CATALOG[role]);

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: ROLE_CATALOG.ADMIN.label,
  NUTRICIONISTA: ROLE_CATALOG.NUTRICIONISTA.label,
  KUVAR: ROLE_CATALOG.KUVAR.label,
  MAGACIONER: ROLE_CATALOG.MAGACIONER.label,
};

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

export function getRoleLabel(role: UserRole | null | undefined) {
  return role ? ROLE_CATALOG[role].label : "Bez uloge";
}
