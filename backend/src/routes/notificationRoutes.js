import { Router } from "express";
import verifyToken from "../middleware/authMiddleware.js";
import { listNotifications, sendNotification, broadcastAlert } from "../controllers/notificationController.js";

const router = Router();
router.use(verifyToken);
router.get("/", listNotifications);
router.post("/send", sendNotification);
router.post("/broadcast", broadcastAlert);

export default router;