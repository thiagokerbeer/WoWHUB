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
  req,
  res,
  next
) => {
  const requestId = req.requestId;

  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof SyntaxError && "body" in error) {
    return res
      .status(400)
      .json({
        ...buildErrorResponse("JSON inválido no corpo da requisição"),
        ...(requestId ? { requestId } : {}),
      });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      ...buildErrorResponse("Dados inválidos", error.flatten().fieldErrors),
      ...(requestId ? { requestId } : {}),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({
          ...buildErrorResponse("Registro duplicado"),
          ...(requestId ? { requestId } : {}),
        });
    }

    if (error.code === "P2025") {
      return res
        .status(404)
        .json({
          ...buildErrorResponse("Registro não encontrado"),
          ...(requestId ? { requestId } : {}),
        });
    }
  }

  if (isAppError(error)) {
    return res
      .status(error.statusCode)
      .json({
        ...buildErrorResponse(error.message, error.details, error.code),
        ...(requestId ? { requestId } : {}),
      });
  }

  if (error instanceof Error && error.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      ...buildErrorResponse(error.message),
      ...(requestId ? { requestId } : {}),
    });
  }

  console.error(error);

  return res.status(500).json({
    ...buildErrorResponse("Erro interno do servidor"),
    ...(requestId ? { requestId } : {}),
  });
};