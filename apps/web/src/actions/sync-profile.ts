"use server";

import { getServiceRoleClient } from "@/lib/supabase/service-role";

type SyncProfileInput = {
  clerkUserId: string;
  email: string;
};

export async function syncProfileAction(input: SyncProfileInput) {
  const supabase = getServiceRoleClient();

  await supabase.from("profiles").upsert(
    {
      clerk_user_id: input.clerkUserId,
      email: input.email
    },
    {
      onConflict: "clerk_user_id"
    }
  );
}
