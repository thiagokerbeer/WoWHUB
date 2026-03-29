import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

export function adminMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return next(new AppError(401, "Não autenticado"));
  }

  if (req.user.role !== "ADMIN") {
    return next(new AppError(403, "Acesso restrito ao admin"));
  }

  return next();
}