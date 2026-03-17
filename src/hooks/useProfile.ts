import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getProfile } from "@/services/api";
import type { ProfileData } from "@/types";

export function useProfile() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const d = await getProfile();
      if (d.success && d.data) setData(d.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Profil yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === "authenticated" && session) {
      void loadProfile();
    }
  }, [session, status, loadProfile]);

  const refresh = () => {
    void loadProfile();
  };

  const resolvedLoading = status === "unauthenticated" ? false : loading;

  return { data, loading: resolvedLoading, error, status, session, refresh, setData };
}
