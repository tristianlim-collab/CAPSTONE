import { Router } from "express";
import verifyToken from "../middleware/authMiddleware.js";
import { listNotifications, sendNotification } from "../controllers/notificationController.js";

const router = Router();
router.use(verifyToken);
router.get("/", listNotifications);
router.post("/send", sendNotification);

export default router;