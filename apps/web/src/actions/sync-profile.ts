"use server";

import { getServiceRoleClient } from "@/lib/supabase/service-role";

type SyncProfileInput = {
  clerkUserId: string;
  email: string;
};

export async function syncProfileAction(input: SyncProfileInput) {
  const supabase = getServiceRoleClient();

  const { error } = await supabase.from("profiles").upsert(
    {
      clerk_user_id: input.clerkUserId,
      email: input.email
    },
    {
      onConflict: "clerk_user_id"
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}
