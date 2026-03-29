import { TicketPriority, TicketStatus } from "@prisma/client";
import { z } from "zod";

export const createTicketSchema = z.object({
  title: z.string().trim().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z
    .string()
    .trim()
    .min(10, "Descrição deve ter pelo menos 10 caracteres"),
  category: z.string().trim().min(2, "Categoria deve ter pelo menos 2 caracteres"),
  priority: z.nativeEnum(TicketPriority),
});

export const addCommentSchema = z.object({
  message: z.string().trim().min(2, "Comentário deve ter pelo menos 2 caracteres"),
});

export const updateTicketStatusSchema = z.object({
  status: z.nativeEnum(TicketStatus),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type AddCommentInput = z.infer<typeof addCommentSchema>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;