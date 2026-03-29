import { Request, Response } from "express";
import { getDashboardService } from "../services/dashboardService";
import { asyncHandler } from "../utils/asyncHandler";

export const getDashboard = asyncHandler(
  async (req: Request, res: Response) => {
    const dashboard = await getDashboardService({
      userId: req.user?.userId,
      role: req.user?.role,
    });

    return res.status(200).json(dashboard);
  }
);