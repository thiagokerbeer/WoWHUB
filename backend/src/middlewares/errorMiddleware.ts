import { Prisma } from "@prisma/client";
import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError, isAppError } from "../utils/AppError";

function buildErrorResponse(message: string, details?: unknown, code?: string) {
  return {
    message,
    ...(details !== undefined ? { errors: details } : {}),
    ...(code ? { code } : {}),
  };
}

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _req,
  res,
  next
) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof SyntaxError && "body" in error) {
    return res
      .status(400)
      .json(buildErrorResponse("JSON inválido no corpo da requisição"));
  }

  if (error instanceof ZodError) {
    return res.status(400).json(
      buildErrorResponse("Dados inválidos", error.flatten().fieldErrors)
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json(buildErrorResponse("Registro duplicado"));
    }

    if (error.code === "P2025") {
      return res
        .status(404)
        .json(buildErrorResponse("Registro não encontrado"));
    }
  }

  if (isAppError(error)) {
    return res
      .status(error.statusCode)
      .json(buildErrorResponse(error.message, error.details, error.code));
  }

  if (error instanceof Error && error.message === "Origin not allowed by CORS") {
    return res.status(403).json(buildErrorResponse(error.message));
  }

  console.error(error);

  return res.status(500).json(buildErrorResponse("Erro interno do servidor"));
};