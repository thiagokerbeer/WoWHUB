import { Prisma, TicketPriority, TicketStatus, UserRole } from "@prisma/client";
import { prisma } from "../config/prisma";
import {
  addCommentSchema,
  createTicketSchema,
  updateTicketStatusSchema,
  type AddCommentInput,
  type CreateTicketInput,
} from "../schemas/ticketSchema";
import { createActivity } from "../utils/activity";
import { AppError, isAppError } from "../utils/AppError";

const ticketListInclude = Prisma.validator<Prisma.TicketInclude>()({
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
});

const ticketCreateInclude = Prisma.validator<Prisma.TicketInclude>()({
  user: {
    select: {
      name: true,
      email: true,
    },
  },
});

const commentInclude = Prisma.validator<Prisma.CommentInclude>()({
  user: {
    select: {
      name: true,
      role: true,
    },
  },
});

function getSingleValue(value: unknown): string | undefined {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized || undefined;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    const normalized = value[0].trim();
    return normalized || undefined;
  }

  return undefined;
}

function parseAuthenticatedUserId(userId?: string) {
  if (!userId) {
    throw new AppError(401, "Não autenticado");
  }

  return userId;
}

function parseTicketId(ticketId?: string) {
  if (!ticketId) {
    throw new AppError(400, "ID do ticket inválido");
  }

  return ticketId;
}

function parseTicketStatusQuery(value: unknown): TicketStatus | undefined {
  const singleValue = getSingleValue(value);

  if (!singleValue) {
    return undefined;
  }

  if (Object.values(TicketStatus).includes(singleValue as TicketStatus)) {
    return singleValue as TicketStatus;
  }

  return undefined;
}

function parseTicketPriorityQuery(value: unknown): TicketPriority | undefined {
  const singleValue = getSingleValue(value);

  if (!singleValue) {
    return undefined;
  }

  if (Object.values(TicketPriority).includes(singleValue as TicketPriority)) {
    return singleValue as TicketPriority;
  }

  return undefined;
}

function parseCreateTicketPayload(payload: unknown): CreateTicketInput {
  const parsed = createTicketSchema.safeParse(payload);

  if (!parsed.success) {
    throw new AppError(400, "Dados inválidos", {
      details: parsed.error.flatten().fieldErrors,
    });
  }

  return parsed.data;
}

function parseUpdateTicketStatusPayload(payload: unknown): TicketStatus {
  const parsed = updateTicketStatusSchema.safeParse(payload);

  if (!parsed.success) {
    throw new AppError(400, "Status inválido");
  }

  return parsed.data.status;
}

function parseCommentPayload(payload: unknown): AddCommentInput {
  const parsed = addCommentSchema.safeParse(payload);

  if (!parsed.success) {
    throw new AppError(400, "Comentário inválido");
  }

  return parsed.data;
}

async function findTicketById(ticketId: string) {
  return prisma.ticket.findUnique({
    where: { id: ticketId },
  });
}

function ensureTicketAccess(params: {
  actorRole?: UserRole;
  actorUserId: string;
  ticketOwnerId: string;
}) {
  if (
    params.actorRole !== "ADMIN" &&
    params.ticketOwnerId !== params.actorUserId
  ) {
    throw new AppError(403, "Sem permissão");
  }
}

function rethrowTicketError(error: unknown, fallbackMessage: string): never {
  if (isAppError(error)) {
    throw error;
  }

  throw new AppError(500, fallbackMessage);
}

export async function getTicketsService(params: {
  actorUserId?: string;
  actorRole?: UserRole;
  statusQuery?: unknown;
  priorityQuery?: unknown;
}) {
  try {
    const actorUserId = parseAuthenticatedUserId(params.actorUserId);
    const status = parseTicketStatusQuery(params.statusQuery);
    const priority = parseTicketPriorityQuery(params.priorityQuery);

    const where: Prisma.TicketWhereInput =
      params.actorRole === "ADMIN"
        ? {
            ...(status ? { status } : {}),
            ...(priority ? { priority } : {}),
          }
        : {
            userId: actorUserId,
            ...(status ? { status } : {}),
            ...(priority ? { priority } : {}),
          };

    const tickets = await prisma.ticket.findMany({
      where,
      include: ticketListInclude,
      orderBy: {
        updatedAt: "desc",
      },
    });

    return tickets;
  } catch (error) {
    return rethrowTicketError(error, "Erro ao buscar tickets");
  }
}

export async function createTicketService(params: {
  actorUserId?: string;
  payload: unknown;
}) {
  try {
    const actorUserId = parseAuthenticatedUserId(params.actorUserId);
    const payload = parseCreateTicketPayload(params.payload);

    const ticket = await prisma.ticket.create({
      data: {
        title: payload.title,
        description: payload.description,
        category: payload.category,
        priority: payload.priority,
        userId: actorUserId,
      },
      include: ticketCreateInclude,
    });

    await createActivity(
      actorUserId,
      "Ticket opened",
      `Created ticket: ${ticket.title}`
    );

    return ticket;
  } catch (error) {
    return rethrowTicketError(error, "Erro ao criar ticket");
  }
}

export async function updateTicketStatusService(params: {
  actorUserId?: string;
  actorRole?: UserRole;
  ticketId?: string;
  payload: unknown;
}) {
  try {
    const actorUserId = parseAuthenticatedUserId(params.actorUserId);
    const ticketId = parseTicketId(params.ticketId);
    const status = parseUpdateTicketStatusPayload(params.payload);

    const ticket = await findTicketById(ticketId);

    if (!ticket) {
      throw new AppError(404, "Ticket não encontrado");
    }

    ensureTicketAccess({
      actorRole: params.actorRole,
      actorUserId,
      ticketOwnerId: ticket.userId,
    });

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status },
    });

    await createActivity(
      actorUserId,
      "Ticket status changed",
      `Ticket ${updatedTicket.title} is now ${updatedTicket.status}`
    );

    return updatedTicket;
  } catch (error) {
    return rethrowTicketError(error, "Erro ao atualizar status do ticket");
  }
}

export async function addTicketCommentService(params: {
  actorUserId?: string;
  actorRole?: UserRole;
  ticketId?: string;
  payload: unknown;
}) {
  try {
    const actorUserId = parseAuthenticatedUserId(params.actorUserId);
    const ticketId = parseTicketId(params.ticketId);
    const payload = parseCommentPayload(params.payload);

    const ticket = await findTicketById(ticketId);

    if (!ticket) {
      throw new AppError(404, "Ticket não encontrado");
    }

    ensureTicketAccess({
      actorRole: params.actorRole,
      actorUserId,
      ticketOwnerId: ticket.userId,
    });

    const comment = await prisma.comment.create({
      data: {
        message: payload.message,
        ticketId,
        userId: actorUserId,
      },
      include: commentInclude,
    });

    await createActivity(
      actorUserId,
      "Ticket comment added",
      `Commented on ticket ${ticket.title}`
    );

    return comment;
  } catch (error) {
    return rethrowTicketError(error, "Erro ao comentar ticket");
  }
}