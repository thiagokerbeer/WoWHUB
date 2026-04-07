import { NextFunction, Request, Response } from "express";

function isSensitivePath(path: string) {
  return path.startsWith("/auth/login") || path.startsWith("/auth/register");
}

export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const startedAt = req.requestStartAt ?? Date.now();
  const requestId = req.requestId ?? "unknown";

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const payload = {
      level: res.statusCode >= 500 ? "error" : "info",
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      userId: req.user?.userId ?? null,
      ip: req.ip,
      userAgent: req.header("user-agent") ?? null,
      body:
        req.body && !isSensitivePath(req.path)
          ? Object.keys(req.body as Record<string, unknown>)
          : undefined,
    };

    console.log(JSON.stringify(payload));
  });

  return next();
}
