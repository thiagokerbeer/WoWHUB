import { z } from "zod";

export const accessActionSchema = z.object({
  action: z.enum([
    "BLOCK",
    "UNBLOCK",
    "BAN_5_DAYS",
    "BAN_30_DAYS",
    "CLEAR_BAN",
  ]),
});

export type AccessAction = z.infer<typeof accessActionSchema>["action"];