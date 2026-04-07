import "express";

declare global {
  namespace Express {
    interface UserPayload {
      userId: string;
      role: "ADMIN" | "USER";
    }

    interface Request {
      user?: UserPayload;
      requestId?: string;
      requestStartAt?: number;
    }
  }
}

export {};