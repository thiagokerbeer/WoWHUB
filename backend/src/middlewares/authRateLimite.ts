import { Request, Response, NextFunction } from "express";

type AttemptEntry = {
  count: number;
  firstAttemptAt: number;
  blockedUntil: number;
};

const attempts = new Map<string, AttemptEntry>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const BLOCK_MS = 15 * 60 * 1000;

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

export function authRateLimit(req: Request, res: Response, next: NextFunction) {
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

    return res.status(429).json({
      message: "Muitas tentativas de autenticação. Aguarde alguns minutos e tente novamente.",
    });
  }

  attempts.set(key, current);

  return next();
}