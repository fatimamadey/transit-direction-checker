function requireServerEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function getServerEnv() {
  return {
    supabaseUrl: requireServerEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseServiceRoleKey: requireServerEnv("SUPABASE_SERVICE_ROLE_KEY")
  };
}
