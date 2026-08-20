"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";

import {
  DASHBOARD_NAVIGATION,
  getRoleLabel,
  type NavigationItem,
} from "@/config/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function isNavigationItemActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  if (href === "/login") {
    return pathname === "/login" || pathname === "/register";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarBrand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-3 rounded-xl px-2 py-2 text-sidebar-foreground outline-none transition hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        collapsed && "justify-center px-0"
      )}
      aria-label="proChef početna"
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
        <ChefHat className="size-5" aria-hidden="true" />
      </span>
      {!collapsed ? (
        <span className="min-w-0">
          <span className="block text-base font-semibold leading-tight">
            proChef
          </span>
          <span className="block truncate text-xs text-sidebar-foreground/60">
            ERP operacije
          </span>
        </span>
      ) : null}
    </Link>
  );
}

function SidebarNavLink({
  item,
  pathname,
  collapsed = false,
  onNavigate,
}: {
  item: NavigationItem;
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const isActive = isNavigationItemActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? item.title : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 outline-none transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        isActive &&
          "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon
        className={cn(
          "size-5 shrink-0",
          isActive ? "text-current" : "text-sidebar-foreground/55"
        )}
        aria-hidden="true"
      />
      {!collapsed ? (
        <span className="min-w-0">
          <span className="block truncate">{item.title}</span>
          <span
            className={cn(
              "block truncate text-xs font-normal",
              isActive
                ? "text-sidebar-primary-foreground/75"
                : "text-sidebar-foreground/45"
            )}
          >
            {item.description}
          </span>
        </span>
      ) : (
        <span className="sr-only">{item.title}</span>
      )}
    </Link>
  );
}

function RolePanel({ collapsed = false }: { collapsed?: boolean }) {
  const { profile, user, isLoading } = useAuth();
  const roleLabel = isLoading ? "Učitavanje" : getRoleLabel(profile?.role);
  const displayName = profile?.full_name || user?.email || "Neprijavljen";

  if (collapsed) {
    return (
      <div className="flex justify-center border-t border-sidebar-border pt-4">
        <Badge variant="secondary" className="size-9 rounded-xl px-0">
          {roleLabel.slice(0, 1)}
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-3">
      <p className="truncate text-sm font-medium text-sidebar-foreground">
        {displayName}
      </p>
      <Badge variant="secondary">{roleLabel}</Badge>
    </div>
  );
}

function SidebarNavigation({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = DASHBOARD_NAVIGATION;

  return (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Glavna navigacija">
      {items.map((item) => (
        <SidebarNavLink
          key={item.href}
          item={item}
          pathname={pathname}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "gpu-sticky sticky top-0 hidden h-screen shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-4">
        <div className="flex items-center justify-between gap-2">
          <SidebarBrand collapsed={collapsed} />
          {!collapsed ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setCollapsed(true)}
              aria-label="Skupi bočnu navigaciju"
            >
              <PanelLeftClose className="size-4" aria-hidden="true" />
            </Button>
          ) : null}
        </div>

        {collapsed ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setCollapsed(false)}
            className="mx-auto"
            aria-label="Proširi bočnu navigaciju"
          >
            <PanelLeftOpen className="size-4" aria-hidden="true" />
          </Button>
        ) : null}

        <SidebarNavigation collapsed={collapsed} />
        <RolePanel collapsed={collapsed} />
      </div>
    </aside>
  );
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[20rem] max-w-[85vw] p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Glavna navigacija</SheetTitle>
          <SheetDescription>
            Navigacija kroz proChef dashboard module.
          </SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-6 p-4">
          <SidebarBrand />
          <SidebarNavigation onNavigate={() => onOpenChange(false)} />
          <RolePanel />
        </div>
      </SheetContent>
    </Sheet>
  );
}
