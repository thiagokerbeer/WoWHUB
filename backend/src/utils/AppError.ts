type AppErrorOptions = {
  code?: string;
  details?: unknown;
};

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    options: AppErrorOptions = {}
  ) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = options.code;
    this.details = options.details;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}