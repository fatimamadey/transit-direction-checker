"use server";

import { getServiceRoleClient } from "@/lib/supabase/service-role";

type SyncProfileInput = {
  clerkUserId: string;
  email: string;
  githubLogin?: string | null;
};

export async function syncProfileAction(input: SyncProfileInput) {
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        clerk_user_id: input.clerkUserId,
        email: input.email,
        github_login: input.githubLogin ?? null
      },
      {
        onConflict: "clerk_user_id"
      }
    )
    .select("id, clerk_user_id, email, github_login")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
