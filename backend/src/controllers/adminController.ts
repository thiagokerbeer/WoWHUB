import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { createActivity } from "../utils/activity";

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

export async function getAdminSnapshot(req: Request, res: Response) {
  try {
    const [users, projects, ticketsByStatus, tasksByStatus, activity] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isBlocked: true,
          bannedUntil: true,
          createdAt: true,
        },
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

export async function blockUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (req.user?.userId === id) {
      return res.status(400).json({
        message: "Você não pode bloquear sua própria conta",
      });
    }

    const targetUser = await findTargetUser(id);

    if (!targetUser) {
      return res.status(404).json({
        message: "Usuário não encontrado",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isBlocked: true,
      },
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

    await createActivity(
      req.user!.userId,
      "Admin blocked user",
      `Blocked ${updatedUser.name} (${updatedUser.email}).`
    );

    return res.status(200).json({
      message: "Usuário bloqueado com sucesso",
      user: updatedUser,
    });
  } catch {
    return res.status(500).json({
      message: "Erro ao bloquear usuário",
    });
  }
}

export async function unblockUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const targetUser = await findTargetUser(id);

    if (!targetUser) {
      return res.status(404).json({
        message: "Usuário não encontrado",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isBlocked: false,
      },
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

    await createActivity(
      req.user!.userId,
      "Admin unblocked user",
      `Unblocked ${updatedUser.name} (${updatedUser.email}).`
    );

    return res.status(200).json({
      message: "Usuário desbloqueado com sucesso",
      user: updatedUser,
    });
  } catch {
    return res.status(500).json({
      message: "Erro ao desbloquear usuário",
    });
  }
}

export async function banUserFor5Days(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (req.user?.userId === id) {
      return res.status(400).json({
        message: "Você não pode banir sua própria conta",
      });
    }

    const targetUser = await findTargetUser(id);

    if (!targetUser) {
      return res.status(404).json({
        message: "Usuário não encontrado",
      });
    }

    const bannedUntil = addDays(5);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        bannedUntil,
      },
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

    await createActivity(
      req.user!.userId,
      "Admin banned user",
      `Applied 5-day ban to ${updatedUser.name} (${updatedUser.email}).`
    );

    return res.status(200).json({
      message: "Ban de 5 dias aplicado com sucesso",
      user: updatedUser,
    });
  } catch {
    return res.status(500).json({
      message: "Erro ao aplicar ban de 5 dias",
    });
  }
}

export async function banUserFor30Days(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (req.user?.userId === id) {
      return res.status(400).json({
        message: "Você não pode banir sua própria conta",
      });
    }

    const targetUser = await findTargetUser(id);

    if (!targetUser) {
      return res.status(404).json({
        message: "Usuário não encontrado",
      });
    }

    const bannedUntil = addDays(30);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        bannedUntil,
      },
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

    await createActivity(
      req.user!.userId,
      "Admin banned user",
      `Applied 30-day ban to ${updatedUser.name} (${updatedUser.email}).`
    );

    return res.status(200).json({
      message: "Ban de 30 dias aplicado com sucesso",
      user: updatedUser,
    });
  } catch {
    return res.status(500).json({
      message: "Erro ao aplicar ban de 30 dias",
    });
  }
}

export async function removeBan(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const targetUser = await findTargetUser(id);

    if (!targetUser) {
      return res.status(404).json({
        message: "Usuário não encontrado",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        bannedUntil: null,
      },
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

    await createActivity(
      req.user!.userId,
      "Admin removed user ban",
      `Removed ban from ${updatedUser.name} (${updatedUser.email}).`
    );

    return res.status(200).json({
      message: "Ban removido com sucesso",
      user: updatedUser,
    });
  } catch {
    return res.status(500).json({
      message: "Erro ao remover ban",
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
      "Admin deleted user",
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