import { Request, Response } from "express";
import {
  addTicketCommentService,
  createTicketService,
  getTicketsService,
  updateTicketStatusService,
} from "../services/ticketService";
import { asyncHandler } from "../utils/asyncHandler";

function normalizeRouteParam(
  value: string | string[] | undefined
): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
    return value[0].trim();
  }

  return undefined;
}

export const getTickets = asyncHandler(async (req: Request, res: Response) => {
  const result = await getTicketsService({
    actorUserId: req.user?.userId,
    actorRole: req.user?.role,
    statusQuery: req.query.status,
    priorityQuery: req.query.priority,
    pageQuery: req.query.page,
    limitQuery: req.query.limit,
  });

  res.setHeader("x-total-count", String(result.meta.total));
  res.setHeader("x-page", String(result.meta.page));
  res.setHeader("x-limit", String(result.meta.limit));
  res.setHeader("x-total-pages", String(result.meta.totalPages));

  return res.status(200).json(result.data);
});

export const createTicket = asyncHandler(
  async (req: Request, res: Response) => {
    const ticket = await createTicketService({
      actorUserId: req.user?.userId,
      payload: req.body,
    });

    return res.status(201).json(ticket);
  }
);

export const updateTicketStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const ticket = await updateTicketStatusService({
      actorUserId: req.user?.userId,
      actorRole: req.user?.role,
      ticketId: normalizeRouteParam(req.params.id),
      payload: req.body,
    });

    return res.status(200).json(ticket);
  }
);

export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await addTicketCommentService({
    actorUserId: req.user?.userId,
    actorRole: req.user?.role,
    ticketId: normalizeRouteParam(req.params.id),
    payload: req.body,
  });

  return res.status(201).json(comment);
});