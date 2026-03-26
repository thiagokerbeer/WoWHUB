import { Router } from "express";
import { getAdminSnapshot } from "../controllers/adminController";
import { adminMiddleware } from "../middlewares/adminMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();
router.get("/snapshot", authMiddleware, adminMiddleware, getAdminSnapshot);
export { router as adminRoutes };
