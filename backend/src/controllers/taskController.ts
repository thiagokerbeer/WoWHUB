import { Request, Response } from "express";
import {
  createTaskService,
  getTasksService,
  updateTaskStatusService,
} from "../services/taskService";
import { asyncHandler } from "../utils/asyncHandler";

function normalizeRouteParam(
  value: string | string[] | undefined
): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
    return value[0].trim();
  }

  return undefined;
}

export const getTasks = asyncHandler(async (req: Request, res: Response) => {
  const tasks = await getTasksService({
    userId: req.user?.userId,
    role: req.user?.role,
    statusQuery: req.query.status,
  });

  return res.status(200).json(tasks);
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await createTaskService({
    actorUserId: req.user?.userId,
    actorRole: req.user?.role,
    payload: req.body,
  });

  return res.status(201).json(task);
});

export const updateTaskStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const task = await updateTaskStatusService({
      actorUserId: req.user?.userId,
      actorRole: req.user?.role,
      taskId: normalizeRouteParam(req.params.id),
      payload: req.body,
    });

    return res.status(200).json(task);
  }
);