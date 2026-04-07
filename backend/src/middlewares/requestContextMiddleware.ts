import { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

export function requestContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const incomingRequestId = req.header("x-request-id");
  const requestId =
    typeof incomingRequestId === "string" && incomingRequestId.trim()
      ? incomingRequestId.trim()
      : randomUUID();

  req.requestId = requestId;
  req.requestStartAt = Date.now();
  res.setHeader("x-request-id", requestId);

  return next();
}
