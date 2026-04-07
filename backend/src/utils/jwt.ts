import jwt from "jsonwebtoken";
import { getEnv } from "../config/env";

export type TokenPayload = {
  userId: string;
  role: "USER" | "ADMIN";
};

export function generateToken(payload: TokenPayload) {
  return jwt.sign(payload, getEnv().jwtSecret, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, getEnv().jwtSecret) as TokenPayload;
}
