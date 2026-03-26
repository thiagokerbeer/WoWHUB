import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export async function getAdminSnapshot(req: Request, res: Response) {
  try {
    const [users, projects, ticketsByStatus, tasksByStatus, activity] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" }
      }),
      prisma.project.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.ticket.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.task.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } }
      })
    ]);

    return res.status(200).json({ users, projects, ticketsByStatus, tasksByStatus, activity });
  } catch {
    return res.status(500).json({ message: "Erro ao buscar snapshot admin" });
  }
}
