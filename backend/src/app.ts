import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { validateEnvOnBoot } from "./config/env";
import { prisma } from "./config/prisma";
import { requestContextMiddleware } from "./middlewares/requestContextMiddleware";
import { requestLoggerMiddleware } from "./middlewares/requestLoggerMiddleware";
import { adminRoutes } from "./routes/adminRoutes";
import { authRoutes } from "./routes/authRoutes";
import { dashboardRoutes } from "./routes/dashboardRoutes";
import { taskRoutes } from "./routes/taskRoutes";
import { ticketRoutes } from "./routes/ticketRoutes";
import { errorMiddleware } from "./middlewares/errorMiddleware";
import { notFoundMiddleware } from "./middlewares/notFoundMiddleware";

dotenv.config();
const env = validateEnvOnBoot();

const app = express();

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/+$/, "").toLowerCase();
}

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  env.frontendUrl,
]
  .filter(Boolean)
  .map((origin) => normalizeOrigin(String(origin)));

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(requestContextMiddleware);
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(normalizeOrigin(origin))) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(requestLoggerMiddleware);

app.get("/", (_req, res) => {
  return res.status(200).json({
    message: "WoWHUB API running",
    product: "WoWHUB",
    version: "1.0.0",
  });
});

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return res.status(503).json({
      status: "degraded",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/tickets", ticketRoutes);
app.use("/tasks", taskRoutes);
app.use("/admin", adminRoutes);

const apiV1 = express.Router();
apiV1.use("/auth", authRoutes);
apiV1.use("/dashboard", dashboardRoutes);
apiV1.use("/tickets", ticketRoutes);
apiV1.use("/tasks", taskRoutes);
apiV1.use("/admin", adminRoutes);

app.use("/api/v1", apiV1);

app.get("/api/v1", (_req, res) => {
  return res.status(200).json({
    message: "WoWHUB API v1 running",
    product: "WoWHUB",
    version: "v1",
  });
});

app.get("/api/v1/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      status: "ok",
      database: "connected",
      version: "v1",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return res.status(503).json({
      status: "degraded",
      database: "disconnected",
      version: "v1",
      timestamp: new Date().toISOString(),
    });
  }
});

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export { app };