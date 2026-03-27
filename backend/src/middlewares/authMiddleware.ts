import { NextFunction, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../config/prisma";
import { verifyToken } from "../utils/jwt";

type DecodedToken = {
  userId: string;
  role: UserRole;
};

type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    role: UserRole;
  };
};

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
    const decoded = verifyToken(token) as DecodedToken;

    if (!decoded?.userId) {
      return res.status(401).json({ message: "Token inválido" });
    }

    const user = await prisma.user.findUnique({
      where: { id: String(decoded.userId) },
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

    if (Boolean(user.isBlocked)) {
      return res.status(403).json({
        message: "Usuário bloqueado pelo administrador",
      });
    }

    const bannedUntil = user.bannedUntil ? new Date(user.bannedUntil) : null;

    if (bannedUntil && bannedUntil > new Date()) {
      return res.status(403).json({
        message: getBanMessage(bannedUntil),
      });
    }

    const authReq = req as AuthenticatedRequest;

    authReq.user = {
      userId: String(user.id),
      role: user.role as UserRole,
    };

    return next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}