import { prisma } from "../config/prisma";

export async function createActivity(userId: string, action: string, details: string) {
  await prisma.activityLog.create({
    data: { userId, action, details }
  });
}
