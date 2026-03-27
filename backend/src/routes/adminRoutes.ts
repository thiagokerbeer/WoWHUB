import { Router } from "express";
import {
  deleteUser,
  getAdminSnapshot,
  updateUserAccess,
} from "../controllers/adminController";
import { adminMiddleware } from "../middlewares/adminMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get("/snapshot", getAdminSnapshot);
router.patch("/users/:id/access", updateUserAccess);
router.delete("/users/:id", deleteUser);

export { router as adminRoutes };