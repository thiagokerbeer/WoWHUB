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

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  return res.status(200).json({
    message: "WoWHUB API running",
    product: "WoWHUB",
    version: "1.0.0"
  });
});

app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/tickets", ticketRoutes);
app.use("/tasks", taskRoutes);
app.use("/admin", adminRoutes);

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`WoWHUB API running on http://localhost:${PORT}`));
