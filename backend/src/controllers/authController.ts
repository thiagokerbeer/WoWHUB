import { Request, Response } from "express";
import { getCurrentUser, loginUser, registerUser } from "../services/authService";
import { asyncHandler } from "../utils/asyncHandler";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await registerUser(req.body);

  return res.status(201).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginUser(req.body);

  return res.status(200).json(result);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await getCurrentUser(req.user?.userId);

  return res.status(200).json(user);
});