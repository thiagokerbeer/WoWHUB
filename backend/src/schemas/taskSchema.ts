import { TaskStatus } from "@prisma/client";
import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().trim().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z
    .string()
    .trim()
    .min(5, "Descrição deve ter pelo menos 5 caracteres"),
  projectId: z.string().trim().min(1, "Projeto é obrigatório"),
  assigneeId: z.string().trim().optional().nullable(),
  dueDate: z.string().trim().optional().nullable(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
});

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;