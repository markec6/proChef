"use client";

import { QuickHubSection } from "@/components/dashboard/quick-hub-section";
import { StockStatusSection } from "@/components/dashboard/stock-status-section";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRoleLabel } from "@/config/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useLocation } from "@/providers/location-provider";

export default function Home() {
  const { user, profile, profileError, isLoading } = useAuth();
  const { activeLocation, locations, isLoading: isLocationLoading } =
    useLocation();

  if (isLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Učitavanje sesije</CardTitle>
            <CardDescription>
              Proveravamo prijavljenog korisnika i profil zaposlenog.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const displayName = profile?.full_name || user.email || "Zaposleni";
  const roleLabel = getRoleLabel(profile?.role);

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-4 py-10">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Dobro došli, {displayName}</CardTitle>
              <CardDescription>
                Aktivna sesija je spremna za rad u proChef dashboardu.
              </CardDescription>
            </div>
            <Badge variant="secondary">{roleLabel}</Badge>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Korisnik
            </p>
            <p className="mt-2 truncate text-lg font-semibold">{displayName}</p>
            <p className="truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Aktivna lokacija
            </p>
            <p className="mt-2 truncate text-lg font-semibold">
              {isLocationLoading
                ? "Učitavanje..."
                : activeLocation?.name ?? "Nema lokacije"}
            </p>
            <p className="text-sm text-muted-foreground">
              {locations.length} lokacije dostupne
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Operativni status
            </p>
            <p className="mt-2 text-lg font-semibold text-emerald-700">
              Sistem aktivan
            </p>
            <p className="text-sm text-muted-foreground">
              Navigacija, profil i lokacije su povezani.
            </p>
          </div>
        </CardContent>
        {profileError ? (
          <CardFooter>
            <p className="text-sm text-destructive">{profileError}</p>
          </CardFooter>
        ) : null}
      </Card>
      <QuickHubSection />
      <StockStatusSection />
    </div>
  );
}
