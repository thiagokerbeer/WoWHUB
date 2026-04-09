import { Request, Response, NextFunction } from "express";
import { getEnv } from "../config/env";

type AttemptEntry = {
  count: number;
  firstAttemptAt: number;
  blockedUntil: number;
};

const attempts = new Map<string, AttemptEntry>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const BLOCK_MS = 15 * 60 * 1000;
const WINDOW_SECONDS = Math.ceil(WINDOW_MS / 1000);
const BLOCK_SECONDS = Math.ceil(BLOCK_MS / 1000);

let upstashWarningShown = false;

function getClientIp(req: Request) {
  const cfConnectingIp = req.headers["cf-connecting-ip"];
  const xForwardedFor = req.headers["x-forwarded-for"];

  if (typeof cfConnectingIp === "string" && cfConnectingIp.trim()) {
    return cfConnectingIp.trim();
  }

  if (typeof xForwardedFor === "string" && xForwardedFor.trim()) {
    return xForwardedFor.split(",")[0].trim();
  }

  return req.ip || "unknown";
}

function buildKey(req: Request) {
  const ip = getClientIp(req);
  const email =
    typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "no-email";

  return `${ip}:${email}`;
}

function clearExpiredEntries(now: number) {
  for (const [key, entry] of attempts.entries()) {
    const expiredWindow = now - entry.firstAttemptAt > WINDOW_MS;
    const expiredBlock = entry.blockedUntil > 0 && now > entry.blockedUntil;

    if (expiredWindow && expiredBlock) {
      attempts.delete(key);
    }

    if (expiredWindow && entry.blockedUntil === 0) {
      attempts.delete(key);
    }
  }
}

function hasUpstashConfigured() {
  const env = getEnv();
  return Boolean(env.upstashRedisRestUrl && env.upstashRedisRestToken);
}

async function increaseUpstashCounter(key: string) {
  const env = getEnv();
  const url = env.upstashRedisRestUrl;
  const token = env.upstashRedisRestToken;

  if (!url || !token) {
    throw new Error("UPSTASH_NOT_CONFIGURED");
  }

  const response = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["TTL", key],
      ["EXPIRE", key, WINDOW_SECONDS],
    ]),
  });

  if (!response.ok) {
    throw new Error("UPSTASH_PIPELINE_FAILED");
  }

  const data = (await response.json()) as Array<{
    result?: number | string;
  }>;

  const currentCount = Number(data[0]?.result ?? 0);
  const currentTtl = Number(data[1]?.result ?? WINDOW_SECONDS);

  return {
    count: Number.isFinite(currentCount) ? currentCount : 0,
    ttlSeconds:
      Number.isFinite(currentTtl) && currentTtl > 0 ? currentTtl : WINDOW_SECONDS,
  };
}

async function blockUpstashKey(key: string) {
  const env = getEnv();
  const url = env.upstashRedisRestUrl;
  const token = env.upstashRedisRestToken;

  if (!url || !token) {
    throw new Error("UPSTASH_NOT_CONFIGURED");
  }

  await fetch(`${url}/set/${encodeURIComponent(key)}/blocked`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await fetch(`${url}/expire/${encodeURIComponent(key)}/${BLOCK_SECONDS}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function authRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (hasUpstashConfigured()) {
    try {
      const key = `auth:attempts:${buildKey(req)}`;
      const result = await increaseUpstashCounter(key);

      if (result.count > MAX_ATTEMPTS) {
        await blockUpstashKey(key);
        res.setHeader("Retry-After", String(BLOCK_SECONDS));

        return res.status(429).json({
          message:
            "Muitas tentativas de autenticação. Aguarde alguns minutos e tente novamente.",
        });
      }

      return next();
    } catch (error) {
      if (!upstashWarningShown) {
        upstashWarningShown = true;
        console.warn(
          "[authRateLimit] Upstash indisponível, fallback para memória local.",
          error
        );
      }
    }
  }

  const now = Date.now();

  clearExpiredEntries(now);

  const key = buildKey(req);
  const current = attempts.get(key);

  if (!current) {
    attempts.set(key, {
      count: 1,
      firstAttemptAt: now,
      blockedUntil: 0,
    });

    return next();
  }

  if (current.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((current.blockedUntil - now) / 1000);
    res.setHeader("Retry-After", String(retryAfterSeconds));

    return res.status(429).json({
      message: `Muitas tentativas. Tente novamente em ${retryAfterSeconds} segundos.`,
    });
  }

  const windowExpired = now - current.firstAttemptAt > WINDOW_MS;

  if (windowExpired) {
    attempts.set(key, {
      count: 1,
      firstAttemptAt: now,
      blockedUntil: 0,
    });

    return next();
  }

  current.count += 1;

  if (current.count > MAX_ATTEMPTS) {
    current.blockedUntil = now + BLOCK_MS;
    res.setHeader("Retry-After", String(BLOCK_SECONDS));

    return res.status(429).json({
      message: "Muitas tentativas de autenticação. Aguarde alguns minutos e tente novamente.",
    });
  }

  attempts.set(key, current);

  return next();
}