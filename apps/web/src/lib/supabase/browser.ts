"use client";

import { useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";
import { getPublicEnv } from "@/lib/public-env";

export function useSupabaseBrowserClient() {
  const { getToken } = useAuth();
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null);

  if (typeof window === "undefined") {
    return null;
  }

  if (!clientRef.current) {
    const publicEnv = getPublicEnv();

    clientRef.current = createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
      accessToken: async () => (await getToken({ template: "supabase" })) ?? null
    });
  }

  return clientRef.current;
}
