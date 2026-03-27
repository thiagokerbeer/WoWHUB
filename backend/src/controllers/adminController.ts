import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { createActivity } from "../utils/activity";

const accessActionSchema = z.object({
  action: z.enum(["BLOCK", "UNBLOCK", "BAN_5_DAYS", "BAN_30_DAYS", "CLEAR_BAN"]),
});

type AccessAction = z.infer<typeof accessActionSchema>["action"];

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isBlocked: true,
  bannedUntil: true,
  createdAt: true,
} as const;

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function normalizeParamId(id: string | string[] | undefined): string | null {
  if (typeof id === "string" && id.trim()) {
    return id;
  }

  if (Array.isArray(id) && typeof id[0] === "string" && id[0].trim()) {
    return id[0];
  }

  return null;
}

async function findTargetUser(userId: string) {
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
        details: (name: string, email: string) => `Applied 5-day ban to ${name} (${email}).`,
      };

    case "BAN_30_DAYS":
      return {
        data: { bannedUntil: addDays(30) },
        activityAction: "Admin temp ban",
        successMessage: "Ban de 30 dias aplicado com sucesso",
        details: (name: string, email: string) => `Applied 30-day ban to ${name} (${email}).`,
      };

    case "CLEAR_BAN":
      return {
        data: { bannedUntil: null },
        activityAction: "Admin clear ban",
        successMessage: "Ban removido com sucesso",
        details: (name: string, email: string) => `Removed ban from ${name} (${email}).`,
      };
    }
}

export async function getAdminSnapshot(req: Request, res: Response) {
  try {
    const [users, projects, ticketsByStatus, tasksByStatus, activity] = await Promise.all([
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

    return res.status(200).json({
      users,
      projects,
      ticketsByStatus,
      tasksByStatus,
      activity,
    });
  } catch {
    return res.status(500).json({
      message: "Erro ao buscar snapshot admin",
    });
  }
}

export async function updateUserAccess(req: Request, res: Response) {
  try {
    const id = normalizeParamId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "ID de usuário inválido",
      });
    }

    const parsed = accessActionSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Ação administrativa inválida",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        message: "Não autenticado",
      });
    }

    if (req.user.userId === id) {
      return res.status(400).json({
        message: "Você não pode alterar o próprio acesso por esta área",
      });
    }

    const targetUser = await findTargetUser(id);

    if (!targetUser) {
      return res.status(404).json({
        message: "Usuário não encontrado",
      });
    }

    const config = getActionConfig(parsed.data.action);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: config.data,
      select: userSelect,
    });

    await createActivity(
      req.user.userId,
      config.activityAction,
      config.details(updatedUser.name, updatedUser.email)
    );

    return res.status(200).json({
      message: config.successMessage,
      user: updatedUser,
    });
  } catch {
    return res.status(500).json({
      message: "Erro ao atualizar acesso do usuário",
    });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const id = normalizeParamId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "ID de usuário inválido",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        message: "Não autenticado",
      });
    }

    if (req.user.userId === id) {
      return res.status(400).json({
        message: "Você não pode excluir sua própria conta",
      });
    }

    const targetUser = await findTargetUser(id);

    if (!targetUser) {
      return res.status(404).json({
        message: "Usuário não encontrado",
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    await createActivity(
      req.user.userId,
      "Admin delete user",
      `Deleted ${targetUser.name} (${targetUser.email}).`
    );

    return res.status(200).json({
      message: "Usuário excluído com sucesso",
    });
  } catch {
    return res.status(500).json({
      message: "Erro ao excluir usuário",
    });
  }
}