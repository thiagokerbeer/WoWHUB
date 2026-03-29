import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

export function notFoundMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  return next(
    new AppError(404, `Rota não encontrada: ${req.method} ${req.originalUrl}`)
  );
}