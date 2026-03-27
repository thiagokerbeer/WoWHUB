import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { adminRoutes } from "./routes/adminRoutes";
import { authRoutes } from "./routes/authRoutes";
import { dashboardRoutes } from "./routes/dashboardRoutes";
import { taskRoutes } from "./routes/taskRoutes";
import { ticketRoutes } from "./routes/ticketRoutes";

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (_req, res) => {
  return res.status(200).json({
    message: "WoWHUB API running",
    product: "WoWHUB",
    version: "1.0.0",
  });
});

app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/tickets", ticketRoutes);
app.use("/tasks", taskRoutes);
app.use("/admin", adminRoutes);

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`WoWHUB API running on port ${PORT}`);
});