import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { createActivity } from "../utils/activity";

const accessActionSchema = z.object({
  action: z.enum(["BLOCK", "UNBLOCK", "BAN_5_DAYS", "BAN_30_DAYS", "CLEAR_BAN"]),
});

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function findTargetUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isBlocked: true,
      bannedUntil: true,
      createdAt: true,
    },
  });
}

function getUserSelect() {
  return {
    id: true,
    name: true,
    email: true,
    role: true,
    isBlocked: true,
    bannedUntil: true,
    createdAt: true,
  } as const;
}

export async function getAdminSnapshot(req: Request, res: Response) {
  try {
    const [users, projects, ticketsByStatus, tasksByStatus, activity] = await Promise.all([
      prisma.user.findMany({
        select: getUserSelect(),
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
    const { id } = req.params;

    const parsed = accessActionSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Ação administrativa inválida",
      });
    }

    if (req.user?.userId === id) {
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

    const { action } = parsed.data;

    let updatedUser;
    let activityAction = "";
    let activityDetails = "";
    let successMessage = "";

    switch (action) {
      case "BLOCK":
        updatedUser = await prisma.user.update({
          where: { id },
          data: {
            isBlocked: true,
          },
          select: getUserSelect(),
        });
        activityAction = "Admin block";
        activityDetails = `Blocked ${updatedUser.name} (${updatedUser.email}).`;
        successMessage = "Usuário bloqueado com sucesso";
        break;

      case "UNBLOCK":
        updatedUser = await prisma.user.update({
          where: { id },
          data: {
            isBlocked: false,
          },
          select: getUserSelect(),
        });
        activityAction = "Admin unblock";
        activityDetails = `Unblocked ${updatedUser.name} (${updatedUser.email}).`;
        successMessage = "Usuário desbloqueado com sucesso";
        break;

      case "BAN_5_DAYS":
        updatedUser = await prisma.user.update({
          where: { id },
          data: {
            bannedUntil: addDays(5),
          },
          select: getUserSelect(),
        });
        activityAction = "Admin temp ban";
        activityDetails = `Applied 5-day ban to ${updatedUser.name} (${updatedUser.email}).`;
        successMessage = "Ban de 5 dias aplicado com sucesso";
        break;

      case "BAN_30_DAYS":
        updatedUser = await prisma.user.update({
          where: { id },
          data: {
            bannedUntil: addDays(30),
          },
          select: getUserSelect(),
        });
        activityAction = "Admin temp ban";
        activityDetails = `Applied 30-day ban to ${updatedUser.name} (${updatedUser.email}).`;
        successMessage = "Ban de 30 dias aplicado com sucesso";
        break;

      case "CLEAR_BAN":
        updatedUser = await prisma.user.update({
          where: { id },
          data: {
            bannedUntil: null,
          },
          select: getUserSelect(),
        });
        activityAction = "Admin clear ban";
        activityDetails = `Removed ban from ${updatedUser.name} (${updatedUser.email}).`;
        successMessage = "Ban removido com sucesso";
        break;
    }

    await createActivity(req.user!.userId, activityAction, activityDetails);

    return res.status(200).json({
      message: successMessage,
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
    const { id } = req.params;

    if (req.user?.userId === id) {
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
      req.user!.userId,
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