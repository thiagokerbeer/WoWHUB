import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { createActivity } from "../utils/activity";

const ticketSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string().min(2),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

const commentSchema = z.object({
  message: z.string().min(2),
});

const statusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_RESPONSE", "RESOLVED", "CLOSED"]),
});

function getSingleQueryParam(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  return undefined;
}

export async function getTickets(req: Request, res: Response) {
  try {
    const role = req.user?.role;
    const userId = req.user?.userId as string;

    const status = getSingleQueryParam(req.query.status);
    const priority = getSingleQueryParam(req.query.priority);

    const where =
      role === "ADMIN"
        ? {
            ...(status ? { status } : {}),
            ...(priority ? { priority } : {}),
          }
        : {
            userId,
            ...(status ? { status } : {}),
            ...(priority ? { priority } : {}),
          };

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return res.status(200).json(tickets);
  } catch {
    return res.status(500).json({ message: "Erro ao buscar tickets" });
  }
}

export async function createTicket(req: Request, res: Response) {
  try {
    const parsed = ticketSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Dados inválidos",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const ticket = await prisma.ticket.create({
      data: {
        ...parsed.data,
        userId: req.user?.userId as string,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    await createActivity(
      req.user?.userId as string,
      "Ticket opened",
      `Created ticket: ${ticket.title}`
    );

    return res.status(201).json(ticket);
  } catch {
    return res.status(500).json({ message: "Erro ao criar ticket" });
  }
}

export async function updateTicketStatus(req: Request, res: Response) {
  try {
    const parsed = statusSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: "Status inválido" });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket não encontrado" });
    }

    if (req.user?.role !== "ADMIN" && ticket.userId !== req.user?.userId) {
      return res.status(403).json({ message: "Sem permissão" });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { status: parsed.data.status },
    });

    await createActivity(
      req.user?.userId as string,
      "Ticket status changed",
      `Ticket ${updatedTicket.title} is now ${updatedTicket.status}`
    );

    return res.status(200).json(updatedTicket);
  } catch {
    return res.status(500).json({ message: "Erro ao atualizar status do ticket" });
  }
}

export async function addComment(req: Request, res: Response) {
  try {
    const parsed = commentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: "Comentário inválido" });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket não encontrado" });
    }

    if (req.user?.role !== "ADMIN" && ticket.userId !== req.user?.userId) {
      return res.status(403).json({ message: "Sem permissão" });
    }

    const comment = await prisma.comment.create({
      data: {
        message: parsed.data.message,
        ticketId: req.params.id,
        userId: req.user?.userId as string,
      },
      include: {
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    await createActivity(
      req.user?.userId as string,
      "Ticket comment added",
      `Commented on ticket ${ticket.title}`
    );

    return res.status(201).json(comment);
  } catch {
    return res.status(500).json({ message: "Erro ao comentar ticket" });
  }
}