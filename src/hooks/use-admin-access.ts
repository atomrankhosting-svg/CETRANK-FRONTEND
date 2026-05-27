import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { isAdminSessionUnlocked } from "@/lib/adminAccess";

/**
 * Admin pages accept either Supabase `profiles.is_admin` or the passcode gate
 * (`sessionStorage.admin_unlocked`), so unlocking the gate is not overridden
 * by a missing DB flag.
 */
export function useAdminAccess() {
  const { user, isLoading: authLoading } = useAuth();
  const sessionUnlocked = isAdminSessionUnlocked();
  const [isDbAdmin, setIsDbAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setIsDbAdmin(null);
      return;
    }

    if (sessionUnlocked) {
      setIsDbAdmin(false);
      return;
    }

    let cancelled = false;

    const checkProfile = async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (!cancelled) {
          setIsDbAdmin(Boolean(profile?.is_admin));
        }
      } catch {
        if (!cancelled) {
          setIsDbAdmin(false);
        }
      }
    };

    void checkProfile();

    return () => {
      cancelled = true;
    };
  }, [user, sessionUnlocked]);

  const loading =
    authLoading || (Boolean(user) && !sessionUnlocked && isDbAdmin === null);

  const allowed = Boolean(user) && (sessionUnlocked || isDbAdmin === true);

  return {
    user,
    loading,
    allowed,
    sessionUnlocked,
    isDbAdmin: isDbAdmin === true,
  };
}
