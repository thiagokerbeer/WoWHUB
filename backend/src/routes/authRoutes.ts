import { Router } from "express";
import { login, me, register } from "../controllers/authController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { authRateLimit } from "../middlewares/authRateLimit";

const router = Router();

router.post("/register", authRateLimit, register);
router.post("/login", authRateLimit, login);
router.get("/me", authMiddleware, me);

export { router as authRoutes };