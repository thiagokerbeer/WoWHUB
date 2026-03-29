import { UserRole } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { verifyToken } from "../utils/jwt";
import { assertUserCanAccess } from "../utils/userAccess";

type DecodedToken = {
  userId: string;
  role: UserRole;
};

function extractBearerToken(authHeader?: string) {
  if (!authHeader) {
    throw new AppError(401, "Token não informado");
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError(401, "Token mal formatado");
  }

  return token;
}

function normalizeAuthError(error: unknown) {
  if (error instanceof AppError) {
    return error;
  }

  if (
    error instanceof Error &&
    ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(
      error.name
    )
  ) {
    return new AppError(401, "Token inválido");
  }

  return error;
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = extractBearerToken(req.headers.authorization);
    const decoded = verifyToken(token) as DecodedToken;

    if (!decoded?.userId) {
      throw new AppError(401, "Token inválido");
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
      throw new AppError(401, "Usuário não encontrado");
    }

    assertUserCanAccess({
      isBlocked: user.isBlocked,
      bannedUntil: user.bannedUntil,
    });

    req.user = {
      userId: String(user.id),
      role: user.role,
    };

    return next();
  } catch (error) {
    return next(normalizeAuthError(error));
  }
}