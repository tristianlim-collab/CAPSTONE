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
  getForecast,
  getModelComparison,
  getPredictionHealth,
  getKDE,
  trainModels,
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

// Forecasting endpoints
router.get("/forecast/:days", getForecast);
router.get("/models/comparison", getModelComparison);
router.get("/prediction/health", getPredictionHealth);
router.get("/visualize/kde", getKDE);
router.post("/train", trainModels);

export default router;