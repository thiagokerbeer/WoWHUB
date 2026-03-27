import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { verifyToken } from "../utils/jwt";

function getBanMessage(bannedUntil: Date) {
  return `Usuário temporariamente banido até ${bannedUntil.toLocaleString("pt-BR")}`;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Token não informado" });
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Token mal formatado" });
  }

  try {
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        role: true,
        isBlocked: true,
        bannedUntil: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Usuário não encontrado" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Usuário bloqueado pelo administrador" });
    }

    if (user.bannedUntil && user.bannedUntil > new Date()) {
      return res.status(403).json({ message: getBanMessage(user.bannedUntil) });
    }

    req.user = {
      userId: user.id,
      role: user.role,
    };

    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}