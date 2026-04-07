type EnvMode = "development" | "test" | "production";

type AppEnv = {
  nodeEnv: EnvMode;
  jwtSecret: string;
  databaseUrl: string;
  frontendUrl: string;
  turnstileEnabled: boolean;
  turnstileSecretKey: string;
  upstashRedisRestUrl: string;
  upstashRedisRestToken: string;
};

function readEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function requireEnv(name: string) {
  const value = readEnv(name);

  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

function resolveEnv(): AppEnv {
  const nodeEnv = (process.env.NODE_ENV || "development") as EnvMode;

  return {
    nodeEnv,
    jwtSecret: readEnv("JWT_SECRET"),
    databaseUrl: readEnv("DATABASE_URL"),
    frontendUrl: readEnv("FRONTEND_URL"),
    turnstileEnabled: readEnv("TURNSTILE_ENABLED") === "true",
    turnstileSecretKey: readEnv("TURNSTILE_SECRET_KEY"),
    upstashRedisRestUrl: readEnv("UPSTASH_REDIS_REST_URL"),
    upstashRedisRestToken: readEnv("UPSTASH_REDIS_REST_TOKEN"),
  };
}

let cachedEnv: AppEnv | null = null;

export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = resolveEnv();
  }

  return cachedEnv;
}

export function validateEnvOnBoot() {
  const env = resolveEnv();

  requireEnv("JWT_SECRET");
  requireEnv("DATABASE_URL");

  if (env.turnstileEnabled && !env.turnstileSecretKey) {
    throw new Error(
      "TURNSTILE_ENABLED=true but TURNSTILE_SECRET_KEY is not configured"
    );
  }

  cachedEnv = env;

  return env;
}
