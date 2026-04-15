import { Router } from "express";
import verifyToken from "../middleware/authMiddleware.js";
import { generateReport, reportHistory } from "../controllers/reportController.js";

const router = Router();
router.use(verifyToken);
router.get("/generate", generateReport);
router.get("/history", reportHistory);

export default router;