import { Request, Response } from "express";
import {
  deleteUserService,
  getAdminSnapshotService,
  updateUserAccessService,
} from "../services/adminService";
import { asyncHandler } from "../utils/asyncHandler";

function normalizeRouteParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
    return value[0].trim();
  }

  return undefined;
}

export const getAdminSnapshot = asyncHandler(
  async (_req: Request, res: Response) => {
    const snapshot = await getAdminSnapshotService();

    return res.status(200).json(snapshot);
  }
);

export const updateUserAccess = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await updateUserAccessService({
      actorUserId: req.user?.userId,
      targetUserId: normalizeRouteParam(req.params.id),
      payload: req.body,
    });

    return res.status(200).json(result);
  }
);

export const deleteUser = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await deleteUserService({
      actorUserId: req.user?.userId,
      targetUserId: normalizeRouteParam(req.params.id),
    });

    return res.status(200).json(result);
  }
);