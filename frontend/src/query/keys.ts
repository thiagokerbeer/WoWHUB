export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  dashboard: ["dashboard"] as const,
  tasks: ["tasks"] as const,
  tickets: ["tickets"] as const,
  admin: {
    snapshot: ["admin", "snapshot"] as const,
  },
} as const;
