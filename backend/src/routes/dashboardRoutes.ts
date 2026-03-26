import { Router } from "express";
import { getDashboard } from "../controllers/dashboardController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();
router.get("/", authMiddleware, getDashboard);
export { router as dashboardRoutes };
