import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import incidentRoutes from "./routes/incidentRoutes.js";
import incidentTypeRoutes from "./routes/incidentTypeRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import barangayRoutes from "./routes/barangayRoutes.js";
import responseUnitRoutes from "./routes/responseUnitRoutes.js";
import evidenceRoutes from "./routes/evidenceRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import { success, error } from "./utils/apiResponse.js";

const app = express();

app.use(
	cors({
		origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:5173"],
		credentials: true,
	})
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/incident-types", incidentTypeRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/barangays", barangayRoutes);
app.use("/api/response-units", responseUnitRoutes);
app.use("/api/evidence", evidenceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportRoutes);

app.get("/api/health", (_req, res) => {
	return res.status(200).json(
		success({
			message: "GAOIRS API is healthy",
			data: { uptime: process.uptime() },
		})
	);
});

app.use((req, res) => {
	return res.status(404).json(error({ message: `Route not found: ${req.originalUrl}` }));
});

app.use((err, _req, res, _next) => {
	const statusCode = err.statusCode || 500;
	return res
		.status(statusCode)
		.json(error({ message: err.message || "Internal server error", error: err }));
});

export default app;
