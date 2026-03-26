import jwt from "jsonwebtoken";

export type TokenPayload = {
  userId: string;
  role: "USER" | "ADMIN";
};

export function generateToken(payload: TokenPayload) {
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;
}
