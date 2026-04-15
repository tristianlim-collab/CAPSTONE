import { Router } from "express";
import verifyToken from "../middleware/authMiddleware.js";
import {
  getByBarangay,
  getByType,
  getHeatmap,
  getPeakHours,
  getResponseTime,
  getSummary,
  getTrend,
} from "../controllers/analyticsController.js";

const router = Router();
router.use(verifyToken);
router.get("/summary", getSummary);
router.get("/by-type", getByType);
router.get("/by-barangay", getByBarangay);
router.get("/trend", getTrend);
router.get("/response-time", getResponseTime);
router.get("/heatmap", getHeatmap);
router.get("/peak-hours", getPeakHours);

export default router;