import { Router } from "express";
import { addComment, createTicket, getTickets, updateTicketStatus } from "../controllers/ticketController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.use(authMiddleware);
router.get("/", getTickets);
router.post("/", createTicket);
router.patch("/:id/status", updateTicketStatus);
router.post("/:id/comments", addComment);

export { router as ticketRoutes };
