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
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  profileError: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getProfileFullName(user: User) {
  const metadataFullName = user.user_metadata.full_name;

  if (typeof metadataFullName === "string" && metadataFullName.trim()) {
    return metadataFullName.trim();
  }

  return user.email ?? "Zaposleni";
}

async function resolveProfile(
  supabase: ReturnType<typeof createClient>,
  user: User
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, primary_location_id, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load profile:", error.message);
    return null;
  }

  if (data) {
    return data;
  }

  console.error(
    `Profile was not found for authenticated user ${getProfileFullName(user)}.`
  );
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setProfileError(null);
      return;
    }

    const nextProfile = await resolveProfile(supabase, user);
    setProfile(nextProfile);
    setProfileError(
      nextProfile ? null : "Profil zaposlenog nije pronađen ili nije dostupan."
    );
  }, [supabase, user]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Failed to sign out:", error.message);
      return;
    }

    setUser(null);
    setProfile(null);
    setProfileError(null);
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      setIsLoading(true);

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      setUser(currentUser);
      setProfileError(null);

      if (currentUser) {
        const nextProfile = await resolveProfile(supabase, currentUser);
        if (isMounted) {
          setProfile(nextProfile);
          setProfileError(
            nextProfile
              ? null
              : "Profil zaposlenog nije pronađen ili nije dostupan."
          );
        }
      } else {
        setProfile(null);
        setProfileError(null);
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        setProfileError(null);
        setIsLoading(false);
        return;
      }

      void (async () => {
        const nextProfile = await resolveProfile(supabase, nextUser);
        if (isMounted) {
          setProfile(nextProfile);
          setProfileError(
            nextProfile
              ? null
              : "Profil zaposlenog nije pronađen ili nije dostupan."
          );
          setIsLoading(false);
        }
      })();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      profileError,
      isLoading,
      signOut,
      refreshProfile,
    }),
    [user, profile, profileError, isLoading, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
