function requirePublicEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function getPublicEnv() {
  return {
    supabaseUrl: requirePublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: requirePublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  };
}
