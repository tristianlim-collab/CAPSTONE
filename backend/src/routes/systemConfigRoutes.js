import { Router } from "express";
import verifyToken from "../middleware/authMiddleware.js";
import { getAllConfigs, updateConfigs } from "../controllers/systemConfigController.js";

const router = Router();

// Protect all routes with authentication
router.use(verifyToken);

// Get all system configurations
router.get("/", getAllConfigs);

// Update system configurations (Admin only check is inside controller)
router.post("/", updateConfigs);

export default router;
