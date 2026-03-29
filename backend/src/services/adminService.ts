import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { accessActionSchema, AccessAction } from "../schemas/adminSchema";
import { createActivity } from "../utils/activity";
import { AppError, isAppError } from "../utils/AppError";

const userSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  name: true,
  email: true,
  role: true,
  isBlocked: true,
  bannedUntil: true,
  createdAt: true,
});

type AdminUser = Prisma.UserGetPayload<{
  select: typeof userSelect;
}>;

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function parseUserId(id?: string) {
  if (!id || !id.trim()) {
    throw new AppError(400, "ID de usuário inválido");
  }

  return id.trim();
}

function parseActorUserId(userId?: string) {
  if (!userId || !userId.trim()) {
    throw new AppError(401, "Não autenticado");
  }

  return userId.trim();
}

function parseAccessAction(payload: unknown): AccessAction {
  const parsed = accessActionSchema.safeParse(payload);

  if (!parsed.success) {
    throw new AppError(400, "Ação administrativa inválida", {
      details: parsed.error.flatten().fieldErrors,
    });
  }

  return parsed.data.action;
}

async function findTargetUser(userId: string): Promise<AdminUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });
}

function getActionConfig(action: AccessAction) {
  switch (action) {
    case "BLOCK":
      return {
        data: { isBlocked: true },
        activityAction: "Admin block",
        successMessage: "Usuário bloqueado com sucesso",
        details: (name: string, email: string) => `Blocked ${name} (${email}).`,
      };

    case "UNBLOCK":
      return {
        data: { isBlocked: false },
        activityAction: "Admin unblock",
        successMessage: "Usuário desbloqueado com sucesso",
        details: (name: string, email: string) => `Unblocked ${name} (${email}).`,
      };

    case "BAN_5_DAYS":
      return {
        data: { bannedUntil: addDays(5) },
        activityAction: "Admin temp ban",
        successMessage: "Ban de 5 dias aplicado com sucesso",
        details: (name: string, email: string) =>
          `Applied 5-day ban to ${name} (${email}).`,
      };

    case "BAN_30_DAYS":
      return {
        data: { bannedUntil: addDays(30) },
        activityAction: "Admin temp ban",
        successMessage: "Ban de 30 dias aplicado com sucesso",
        details: (name: string, email: string) =>
          `Applied 30-day ban to ${name} (${email}).`,
      };

    case "CLEAR_BAN":
      return {
        data: { bannedUntil: null },
        activityAction: "Admin clear ban",
        successMessage: "Ban removido com sucesso",
        details: (name: string, email: string) =>
          `Removed ban from ${name} (${email}).`,
      };
  }
}

function rethrowAdminError(error: unknown, fallbackMessage: string): never {
  if (isAppError(error)) {
    throw error;
  }

  throw new AppError(500, fallbackMessage);
}

export async function getAdminSnapshotService() {
  try {
    const [users, projects, ticketsByStatus, tasksByStatus, activity] =
      await Promise.all([
        prisma.user.findMany({
          select: userSelect,
          orderBy: { createdAt: "desc" },
        }),
        prisma.project.findMany({
          orderBy: { createdAt: "desc" },
        }),
        prisma.ticket.groupBy({
          by: ["status"],
          _count: { status: true },
        }),
        prisma.task.groupBy({
          by: ["status"],
          _count: { status: true },
        }),
        prisma.activityLog.findMany({
          take: 12,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        }),
      ]);

    return {
      users,
      projects,
      ticketsByStatus,
      tasksByStatus,
      activity,
    };
  } catch (error) {
    return rethrowAdminError(error, "Erro ao buscar snapshot admin");
  }
}

export async function updateUserAccessService(params: {
  actorUserId?: string;
  targetUserId?: string;
  payload: unknown;
}) {
  try {
    const actorUserId = parseActorUserId(params.actorUserId);
    const targetUserId = parseUserId(params.targetUserId);
    const action = parseAccessAction(params.payload);

    if (actorUserId === targetUserId) {
      throw new AppError(
        400,
        "Você não pode alterar o próprio acesso por esta área"
      );
    }

    const targetUser = await findTargetUser(targetUserId);

    if (!targetUser) {
      throw new AppError(404, "Usuário não encontrado");
    }

    const config = getActionConfig(action);

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: config.data,
      select: userSelect,
    });

    await createActivity(
      actorUserId,
      config.activityAction,
      config.details(updatedUser.name, updatedUser.email)
    );

    return {
      message: config.successMessage,
      user: updatedUser,
    };
  } catch (error) {
    return rethrowAdminError(error, "Erro ao atualizar acesso do usuário");
  }
}

export async function deleteUserService(params: {
  actorUserId?: string;
  targetUserId?: string;
}) {
  try {
    const actorUserId = parseActorUserId(params.actorUserId);
    const targetUserId = parseUserId(params.targetUserId);

    if (actorUserId === targetUserId) {
      throw new AppError(400, "Você não pode excluir sua própria conta");
    }

    const targetUser = await findTargetUser(targetUserId);

    if (!targetUser) {
      throw new AppError(404, "Usuário não encontrado");
    }

    await prisma.user.delete({
      where: { id: targetUserId },
    });

    await createActivity(
      actorUserId,
      "Admin delete user",
      `Deleted ${targetUser.name} (${targetUser.email}).`
    );

    return {
      message: "Usuário excluído com sucesso",
    };
  } catch (error) {
    return rethrowAdminError(error, "Erro ao excluir usuário");
  }
}