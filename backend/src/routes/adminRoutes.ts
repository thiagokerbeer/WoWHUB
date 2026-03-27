import { Router } from "express";
import {
  banUserFor30Days,
  banUserFor5Days,
  blockUser,
  deleteUser,
  getAdminSnapshot,
  removeBan,
  unblockUser,
} from "../controllers/adminController";
import { adminMiddleware } from "../middlewares/adminMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get("/snapshot", getAdminSnapshot);
router.patch("/users/:id/block", blockUser);
router.patch("/users/:id/unblock", unblockUser);
router.patch("/users/:id/ban-5-days", banUserFor5Days);
router.patch("/users/:id/ban-30-days", banUserFor30Days);
router.patch("/users/:id/remove-ban", removeBan);
router.delete("/users/:id", deleteUser);

export { router as adminRoutes };