import { AppError } from "./AppError";

type PaginationInput = {
  page?: unknown;
  limit?: unknown;
  maxLimit?: number;
};

function parsePositiveInteger(rawValue: unknown, fieldName: string) {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return undefined;
  }

  const singleValue =
    typeof rawValue === "string"
      ? rawValue
      : Array.isArray(rawValue)
        ? rawValue[0]
        : String(rawValue);

  const parsed = Number(singleValue);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(400, `${fieldName} deve ser um inteiro positivo`);
  }

  return parsed;
}

export function parsePagination(input: PaginationInput) {
  const page = parsePositiveInteger(input.page, "page") ?? 1;
  const limit = parsePositiveInteger(input.limit, "limit") ?? 20;
  const maxLimit = input.maxLimit ?? 100;

  if (limit > maxLimit) {
    throw new AppError(400, `limit deve ser menor ou igual a ${maxLimit}`);
  }

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
}
