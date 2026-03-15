type EnvSpec = Record<string, { optional?: boolean }>;

export function validateEnv(spec: EnvSpec) {
  const missing: string[] = [];
  Object.entries(spec).forEach(([key, opts]) => {
    if (!process.env[key] && !opts.optional) missing.push(key);
  });
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export function getEnv(key: string, fallback?: string): string {
  const val = process.env[key];
  if (val) return val;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing env var ${key}`);
}
