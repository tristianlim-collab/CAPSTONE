import { Router } from "express";
import verifyToken from "../middleware/authMiddleware.js";
import { listAuditLogs, listDistinctActions } from "../controllers/auditController.js";

const router = Router();
router.use(verifyToken);
router.get("/", listAuditLogs);
router.get("/actions", listDistinctActions);

export default router;
