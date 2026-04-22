function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export const config = {
  supabaseUrl: requireEnv("SUPABASE_PROJECT_URL"),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  ctaApiKey: requireEnv("CTA_TRAIN_TRACKER_API_KEY"),
  pollIntervalMs: Number(process.env.WORKER_POLL_INTERVAL_MS ?? "60000")
};
