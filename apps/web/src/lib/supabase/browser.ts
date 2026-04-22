"use client";

import { useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/public-env";

export function useSupabaseBrowserClient() {
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null);

  if (!clientRef.current) {
    const publicEnv = getPublicEnv();

    clientRef.current = createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
  }

  return clientRef.current;
}
