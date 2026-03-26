import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export async function getDashboard(req: Request, res: Response) {
  try {
    const userId = req.user?.userId as string;
    const role = req.user?.role;

    const whereTickets = role === "ADMIN" ? {} : { userId };
    const whereTasks = role === "ADMIN" ? {} : { OR: [{ assigneeId: userId }, { createdById: userId }] };

    const [tickets, tasks, projectsCount, usersCount, recentActivity] = await Promise.all([
      prisma.ticket.findMany({
        where: whereTickets,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { user: { select: { name: true } } }
      }),
      prisma.task.findMany({
        where: whereTasks,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          project: { select: { name: true } },
          assignee: { select: { name: true } }
        }
      }),
      prisma.project.count(),
      prisma.user.count(),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { user: { select: { name: true } } }
      })
    ]);

    const metrics = {
      openTickets: await prisma.ticket.count({ where: { ...whereTickets, status: { in: ["OPEN", "IN_PROGRESS", "WAITING_RESPONSE"] } } }),
      resolvedTickets: await prisma.ticket.count({ where: { ...whereTickets, status: { in: ["RESOLVED", "CLOSED"] } } }),
      tasksInProgress: await prisma.task.count({ where: { ...whereTasks, status: "DOING" } }),
      projectsCount,
      usersCount
    };

    return res.status(200).json({ metrics, tickets, tasks, recentActivity });
  } catch {
    return res.status(500).json({ message: "Erro ao buscar dashboard" });
  }
}
