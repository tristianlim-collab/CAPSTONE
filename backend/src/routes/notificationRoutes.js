import { Router } from "express";
import verifyToken from "../middleware/authMiddleware.js";
import { 
  listNotifications, 
  sendNotification, 
  broadcastAlert,
  markAsRead,
  markAllAsRead
} from "../controllers/notificationController.js";

const router = Router();
router.use(verifyToken);
router.get("/", listNotifications);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);
router.post("/send", sendNotification);
router.post("/broadcast", broadcastAlert);

export default router;