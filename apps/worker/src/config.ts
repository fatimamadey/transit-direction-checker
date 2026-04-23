import { DEFAULT_SOURCE_POLL_INTERVAL_SECONDS, WORKER_TICK_MS } from "@take-this-one/shared";

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
  githubToken: requireEnv("GITHUB_TOKEN"),
  workerTickMs: Number(process.env.WORKER_POLL_INTERVAL_MS ?? String(WORKER_TICK_MS)),
  defaultSourcePollIntervalSeconds: Number(
    process.env.DEFAULT_SOURCE_POLL_INTERVAL_SECONDS ?? String(DEFAULT_SOURCE_POLL_INTERVAL_SECONDS)
  ),
  sourceBatchSize: Number(process.env.SOURCE_BATCH_SIZE ?? "20")
};
