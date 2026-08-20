"use client";

import { Building2, Check, ChevronDown, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLocation } from "@/providers/location-provider";
import type { Location } from "@/types/database";

function getLocationDescription(location: Location) {
  switch (location.code) {
    case "DOBANOVCI":
      return "Centralni magacin";
    case "GENEKS":
      return "Lokacija Geneks";
    case "ZVEZDARA":
      return "Lokacija Zvezdara";
    default:
      return "Aktivna lokacija";
  }
}

export function LocationSwitcher() {
  const { activeLocation, locations, setActiveLocation, isLoading } =
    useLocation();

  const isEmpty = !isLoading && locations.length === 0;
  const triggerLabel =
    activeLocation?.name ?? (isLoading ? "Učitavanje" : "Nema lokacije");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-10 justify-between gap-3 px-3 sm:min-w-52"
            disabled={isLoading || isEmpty}
            aria-label="Izaberite aktivnu lokaciju"
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-lg",
              activeLocation
                ? "bg-emerald-500/10 text-emerald-700"
                : "bg-muted text-muted-foreground"
            )}
          >
            <MapPin className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 text-left">
            <span className="block truncate text-sm font-medium">
              {triggerLabel}
            </span>
            <span className="hidden truncate text-xs text-muted-foreground sm:block">
              {activeLocation
                ? getLocationDescription(activeLocation)
                : "Aktivna lokacija"}
            </span>
          </span>
        </span>
        <ChevronDown
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72">
        <div className="px-1.5 py-1 text-xs font-medium text-muted-foreground">
          Lokacija za rad
        </div>
        <DropdownMenuSeparator />

        {locations.map((location) => {
          const isSelected = location.id === activeLocation?.id;

          return (
            <DropdownMenuItem
              key={location.id}
              onClick={() => setActiveLocation(location)}
              className="cursor-pointer gap-3 p-2"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Building2 className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-medium">{location.name}</span>
                  {location.code === "DOBANOVCI" ? (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-500/10 text-emerald-700"
                    >
                      Hub
                    </Badge>
                  ) : null}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {getLocationDescription(location)}
                </span>
              </span>
              <Check
                className={cn(
                  "size-4 shrink-0 text-emerald-600 transition-opacity",
                  isSelected ? "opacity-100" : "opacity-0"
                )}
                aria-hidden="true"
              />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
