import { Prisma, TaskStatus, UserRole } from "@prisma/client";
import { prisma } from "../config/prisma";
import {
  createTaskSchema,
  updateTaskStatusSchema,
  type CreateTaskInput,
} from "../schemas/taskSchema";
import { createActivity } from "../utils/activity";
import { AppError, isAppError } from "../utils/AppError";
import { parsePagination } from "../utils/pagination";

const taskInclude = Prisma.validator<Prisma.TaskInclude>()({
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
});

function getSingleValue(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value.trim() || undefined;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0].trim() || undefined;
  }

  return undefined;
}

function parseTaskStatusQuery(value: unknown): TaskStatus | undefined {
  const singleValue = getSingleValue(value);

  if (!singleValue) {
    return undefined;
  }

  if (Object.values(TaskStatus).includes(singleValue as TaskStatus)) {
    return singleValue as TaskStatus;
  }

  throw new AppError(400, "Status de tarefa inválido");
}

function parseTaskId(taskId?: string) {
  if (!taskId) {
    throw new AppError(400, "ID da tarefa inválido");
  }

  return taskId;
}

function parseAuthenticatedUserId(userId?: string) {
  if (!userId) {
    throw new AppError(401, "Não autenticado");
  }

  return userId;
}

function parseCreateTaskPayload(payload: unknown): CreateTaskInput {
  const parsed = createTaskSchema.safeParse(payload);

  if (!parsed.success) {
    throw new AppError(400, "Dados inválidos", {
      details: parsed.error.flatten().fieldErrors,
    });
  }

  return parsed.data;
}

function parseUpdateTaskStatusPayload(payload: unknown): TaskStatus {
  const parsed = updateTaskStatusSchema.safeParse(payload);

  if (!parsed.success) {
    throw new AppError(400, "Status inválido", {
      details: parsed.error.flatten().fieldErrors,
    });
  }

  return parsed.data.status;
}

function parseDueDate(dueDate?: string | null) {
  if (!dueDate) {
    return null;
  }

  const parsedDate = new Date(dueDate);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError(400, "Data de vencimento inválida");
  }

  return parsedDate;
}

function normalizeOptionalId(value?: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

async function ensureProjectExists(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  if (!project) {
    throw new AppError(404, "Projeto não encontrado");
  }
}

async function ensureAssigneeExists(assigneeId: string | null) {
  if (!assigneeId) {
    return;
  }

  const assignee = await prisma.user.findUnique({
    where: { id: assigneeId },
    select: { id: true },
  });

  if (!assignee) {
    throw new AppError(404, "Responsável não encontrado");
  }
}

function rethrowTaskError(error: unknown, fallbackMessage: string): never {
  if (isAppError(error)) {
    throw error;
  }

  throw new AppError(500, fallbackMessage);
}

export async function getTasksService(params: {
  userId?: string;
  role?: UserRole;
  statusQuery?: unknown;
  pageQuery?: unknown;
  limitQuery?: unknown;
}) {
  try {
    const userId = parseAuthenticatedUserId(params.userId);
    const status = parseTaskStatusQuery(params.statusQuery);
    const pagination = parsePagination({
      page: params.pageQuery,
      limit: params.limitQuery,
    });

    const where: Prisma.TaskWhereInput =
      params.role === "ADMIN"
        ? {
            ...(status ? { status } : {}),
          }
        : {
            OR: [{ assigneeId: userId }, { createdById: userId }],
            ...(status ? { status } : {}),
          };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: taskInclude,
        orderBy: {
          updatedAt: "desc",
        },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  } catch (error) {
    return rethrowTaskError(error, "Erro ao buscar tarefas");
  }
}

export async function createTaskService(params: {
  actorUserId?: string;
  actorRole?: UserRole;
  payload: unknown;
}) {
  try {
    const actorUserId = parseAuthenticatedUserId(params.actorUserId);

    if (params.actorRole !== "ADMIN") {
      throw new AppError(403, "Somente admins podem criar tarefas");
    }

    const payload = parseCreateTaskPayload(params.payload);
    const assigneeId = normalizeOptionalId(payload.assigneeId);
    const dueDate = parseDueDate(payload.dueDate);

    await ensureProjectExists(payload.projectId);
    await ensureAssigneeExists(assigneeId);

    const task = await prisma.task.create({
      data: {
        title: payload.title,
        description: payload.description,
        projectId: payload.projectId,
        assigneeId,
        dueDate,
        status: payload.status,
        createdById: actorUserId,
      },
      include: taskInclude,
    });

    await createActivity(
      actorUserId,
      "Task created",
      `Created task: ${task.title}`
    );

    return task;
  } catch (error) {
    return rethrowTaskError(error, "Erro ao criar tarefa");
  }
}

export async function updateTaskStatusService(params: {
  actorUserId?: string;
  actorRole?: UserRole;
  taskId?: string;
  payload: unknown;
}) {
  try {
    const actorUserId = parseAuthenticatedUserId(params.actorUserId);
    const taskId = parseTaskId(params.taskId);
    const status = parseUpdateTaskStatusPayload(params.payload);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        status: true,
        assigneeId: true,
        createdById: true,
      },
    });

    if (!task) {
      throw new AppError(404, "Tarefa não encontrada");
    }

    if (
      params.actorRole !== "ADMIN" &&
      task.assigneeId !== actorUserId &&
      task.createdById !== actorUserId
    ) {
      throw new AppError(403, "Sem permissão");
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status },
      include: taskInclude,
    });

    await createActivity(
      actorUserId,
      "Task status changed",
      `Task ${updatedTask.title} moved to ${updatedTask.status}`
    );

    return updatedTask;
  } catch (error) {
    return rethrowTaskError(error, "Erro ao atualizar status da tarefa");
  }
}