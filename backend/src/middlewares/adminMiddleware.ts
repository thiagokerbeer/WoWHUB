import { NextFunction, Request, Response } from "express";

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Acesso restrito ao admin" });
  }

  next();
}
