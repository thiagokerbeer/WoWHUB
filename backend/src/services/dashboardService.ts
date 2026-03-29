import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError, isAppError } from "../utils/AppError";

const dashboardTicketInclude = Prisma.validator<Prisma.TicketInclude>()({
  user: {
    select: {
      name: true,
    },
  },
});

const dashboardTaskInclude = Prisma.validator<Prisma.TaskInclude>()({
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
});

const dashboardActivityInclude = Prisma.validator<Prisma.ActivityLogInclude>()({
  user: {
    select: {
      name: true,
    },
  },
});

function parseAuthenticatedUserId(userId?: string) {
  if (!userId) {
    throw new AppError(401, "Não autenticado");
  }

  return userId;
}

function buildTicketWhere(role?: UserRole, userId?: string): Prisma.TicketWhereInput {
  if (role === "ADMIN") {
    return {};
  }

  return {
    userId,
  };
}

function buildTaskWhere(role?: UserRole, userId?: string): Prisma.TaskWhereInput {
  if (role === "ADMIN") {
    return {};
  }

  return {
    OR: [{ assigneeId: userId }, { createdById: userId }],
  };
}

function rethrowDashboardError(error: unknown, fallbackMessage: string): never {
  if (isAppError(error)) {
    throw error;
  }

  throw new AppError(500, fallbackMessage);
}

export async function getDashboardService(params: {
  userId?: string;
  role?: UserRole;
}) {
  try {
    const userId = parseAuthenticatedUserId(params.userId);
    const whereTickets = buildTicketWhere(params.role, userId);
    const whereTasks = buildTaskWhere(params.role, userId);

    const [
      tickets,
      tasks,
      projectsCount,
      usersCount,
      recentActivity,
      openTickets,
      resolvedTickets,
      tasksInProgress,
    ] = await Promise.all([
      prisma.ticket.findMany({
        where: whereTickets,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: dashboardTicketInclude,
      }),
      prisma.task.findMany({
        where: whereTasks,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: dashboardTaskInclude,
      }),
      prisma.project.count(),
      prisma.user.count(),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: dashboardActivityInclude,
      }),
      prisma.ticket.count({
        where: {
          ...whereTickets,
          status: {
            in: ["OPEN", "IN_PROGRESS", "WAITING_RESPONSE"],
          },
        },
      }),
      prisma.ticket.count({
        where: {
          ...whereTickets,
          status: {
            in: ["RESOLVED", "CLOSED"],
          },
        },
      }),
      prisma.task.count({
        where: {
          ...whereTasks,
          status: "DOING",
        },
      }),
    ]);

    return {
      metrics: {
        openTickets,
        resolvedTickets,
        tasksInProgress,
        projectsCount,
        usersCount,
      },
      tickets,
      tasks,
      recentActivity,
    };
  } catch (error) {
    return rethrowDashboardError(error, "Erro ao buscar dashboard");
  }
}