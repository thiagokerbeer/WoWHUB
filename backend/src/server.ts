import { app } from "./app";
import { prisma } from "./config/prisma";

const PORT = process.env.PORT || 3333;

const server = app.listen(PORT, () => {
  console.log(`WoWHUB API running on port ${PORT}`);
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down WoWHUB API...`);

  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log("Prisma disconnected.");
    } finally {
      process.exit(0);
    }
  });

  setTimeout(() => {
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});