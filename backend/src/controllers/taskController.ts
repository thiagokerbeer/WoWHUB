import { Request, Response } from "express";
import { Prisma, TaskStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { createActivity } from "../utils/activity";

const taskSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  projectId: z.string().min(1),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
});

function getSingleValue(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  return undefined;
}

function parseTaskStatus(value: unknown): TaskStatus | undefined {
  const singleValue = getSingleValue(value);

  if (!singleValue) {
    return undefined;
  }

  if (Object.values(TaskStatus).includes(singleValue as TaskStatus)) {
    return singleValue as TaskStatus;
  }

  return undefined;
}

export async function getTasks(req: Request, res: Response) {
  try {
    const status = parseTaskStatus(req.query.status);

    const where: Prisma.TaskWhereInput =
      req.user?.role === "ADMIN"
        ? {
            ...(status ? { status } : {}),
          }
        : {
            OR: [
              { assigneeId: req.user?.userId },
              { createdById: req.user?.userId },
            ],
            ...(status ? { status } : {}),
          };

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          select: {
            name: true,
          },
        },
        assignee: {
          select: {
            name: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return res.status(200).json(tasks);
  } catch {
    return res.status(500).json({ message: "Erro ao buscar tarefas" });
  }
}

export async function createTask(req: Request, res: Response) {
  try {
    if (req.user?.role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "Somente admins podem criar tarefas" });
    }

    const parsed = taskSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Dados inválidos",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const task = await prisma.task.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        projectId: parsed.data.projectId,
        assigneeId: parsed.data.assigneeId ?? null,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        status: parsed.data.status,
        createdById: req.user.userId,
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        assignee: {
          select: {
            name: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    await createActivity(
      req.user.userId,
      "Task created",
      `Created task: ${task.title}`
    );

    return res.status(201).json(task);
  } catch {
    return res.status(500).json({ message: "Erro ao criar tarefa" });
  }
}

export async function updateTaskStatus(req: Request, res: Response) {
  try {
    const parsed = z
      .object({
        status: z.nativeEnum(TaskStatus),
      })
      .safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: "Status inválido" });
    }

    const taskId = getSingleValue(req.params.id);

    if (!taskId) {
      return res.status(400).json({ message: "ID da tarefa inválido" });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }

    if (
      req.user?.role !== "ADMIN" &&
      task.assigneeId !== req.user?.userId &&
      task.createdById !== req.user?.userId
    ) {
      return res.status(403).json({ message: "Sem permissão" });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: parsed.data.status },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        assignee: {
          select: {
            name: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    await createActivity(
      req.user?.userId as string,
      "Task status changed",
      `Task ${updatedTask.title} moved to ${updatedTask.status}`
    );

    return res.status(200).json(updatedTask);
  } catch {
    return res
      .status(500)
      .json({ message: "Erro ao atualizar status da tarefa" });
  }
}