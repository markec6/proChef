"use client";

import { useMemo, useState } from "react";
import { LogOut, MapPin, Menu, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { DeleteAccountDialog } from "@/components/layout/delete-account-dialog";
import { LocationSwitcher } from "@/components/layout/location-switcher";
import { MobileSidebar } from "@/components/layout/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getRoleLabel } from "@/config/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useLocation } from "@/providers/location-provider";

function getInitials(nameOrEmail: string) {
  const parts = nameOrEmail
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "PC";
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

export function Header() {
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { user, profile, isLoading: isAuthLoading, signOut } = useAuth();
  const { activeLocation, isLoading: isLocationLoading } = useLocation();

  const displayName = profile?.full_name || user?.email || "Neprijavljen";
  const roleLabel = getRoleLabel(profile?.role);
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    router.replace("/login");
    setIsSigningOut(false);
  };

  return (
    <>
      <MobileSidebar
        open={isMobileSidebarOpen}
        onOpenChange={setIsMobileSidebarOpen}
      />

      <header className="gpu-sticky sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur supports-backdrop-filter:bg-background/70 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Otvori navigaciju"
          >
            <Menu className="size-5" aria-hidden="true" />
          </Button>

          <LocationSwitcher />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge
            variant="outline"
            className="hidden h-9 gap-2 rounded-lg px-3 sm:inline-flex"
          >
            <span className="size-2 rounded-full bg-emerald-500" />
            <MapPin className="size-3.5 text-muted-foreground" aria-hidden="true" />
            {isLocationLoading
              ? "Lokacija..."
              : activeLocation?.name ?? "Nema lokacije"}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 gap-2 rounded-xl px-2"
                  aria-label="Otvori korisnički meni"
                />
              }
            >
              <Avatar size="sm">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-36 truncate text-sm font-medium md:block">
                {isAuthLoading ? "Učitavanje" : displayName}
              </span>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64">
              <div className="space-y-2 p-2">
                <span className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {displayName}
                    </span>
                    <span className="block truncate text-xs font-normal text-muted-foreground">
                      {user?.email ?? "Nema aktivne sesije"}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Badge variant="secondary">
                    <ShieldCheck className="size-3" aria-hidden="true" />
                    {roleLabel}
                  </Badge>
                </span>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2" disabled>
                <UserRound className="size-4" aria-hidden="true" />
                Profil zaposlenog
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer gap-2"
                disabled={isSigningOut || !user}
                onClick={() => void handleSignOut()}
              >
                <LogOut className="size-4" aria-hidden="true" />
                {isSigningOut ? "Odjava..." : "Odjavi se"}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer gap-2 text-red-500 hover:bg-red-500/10"
                disabled={!user}
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Obriši nalog
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {user ? (
        <DeleteAccountDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} />
      ) : null}
    </>
  );
}
