"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import type { Location } from "@/types/database";

const ACTIVE_LOCATION_STORAGE_KEY = "prochef_active_location_id";

interface LocationContextValue {
  activeLocation: Location | null;
  locations: Location[];
  setActiveLocation: (location: Location) => void;
  isLoading: boolean;
}

const LocationContext = createContext<LocationContextValue | undefined>(
  undefined
);

function readStoredLocationId() {
  try {
    return window.localStorage.getItem(ACTIVE_LOCATION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistLocationId(locationId: string) {
  try {
    window.localStorage.setItem(ACTIVE_LOCATION_STORAGE_KEY, locationId);
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }
}

function resolveActiveLocation(
  locations: Location[],
  preferredLocationId: string | null
) {
  const storedLocationId = readStoredLocationId();

  return (
    locations.find((location) => location.id === storedLocationId) ??
    locations.find((location) => location.id === preferredLocationId) ??
    locations.find((location) => location.code === "DOBANOVCI") ??
    locations[0] ??
    null
  );
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeLocation, setActiveLocationState] = useState<Location | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    let isMounted = true;

    const loadLocations = async () => {
      setIsLoading(true);

      if (!user) {
        setLocations([]);
        setActiveLocationState(null);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .order("name", { ascending: true });

      if (!isMounted) {
        return;
      }

      if (error) {
        setLocations([]);
        setActiveLocationState(null);
        setIsLoading(false);
        return;
      }

      const nextLocations = data ?? [];
      const nextActiveLocation = resolveActiveLocation(
        nextLocations,
        profile?.primary_location_id ?? null
      );

      setLocations(nextLocations);
      setActiveLocationState(nextActiveLocation);

      if (nextActiveLocation) {
        persistLocationId(nextActiveLocation.id);
      }

      setIsLoading(false);
    };

    void loadLocations();

    return () => {
      isMounted = false;
    };
  }, [isAuthLoading, profile?.primary_location_id, supabase, user]);

  const setActiveLocation = useCallback((location: Location) => {
    setActiveLocationState(location);
    persistLocationId(location.id);
  }, []);

  const value = useMemo<LocationContextValue>(
    () => ({
      activeLocation,
      locations,
      setActiveLocation,
      isLoading: isAuthLoading || isLoading,
    }),
    [activeLocation, locations, setActiveLocation, isAuthLoading, isLoading]
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);

  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }

  return context;
}
