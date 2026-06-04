import { Router } from "express";
import verifyToken from "../middleware/authMiddleware.js";
import { generateReport, reportHistory } from "../controllers/reportController.js";
import { exportIncidents, exportIncidentsPDF, exportPostReports, exportPostReportsPDF } from "../controllers/reportExportController.js";

const router = Router();
router.use(verifyToken);
router.get("/generate", generateReport);
router.get("/history", reportHistory);
router.get("/export", exportIncidents);
router.get("/export/pdf", exportIncidentsPDF);
router.get("/export/post-reports", exportPostReports);
router.get("/export/post-reports/pdf", exportPostReportsPDF);

export default router;