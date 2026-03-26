import { Router } from "express";
import { createTask, getTasks, updateTaskStatus } from "../controllers/taskController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.use(authMiddleware);
router.get("/", getTasks);
router.post("/", createTask);
router.patch("/:id/status", updateTaskStatus);

export { router as taskRoutes };
