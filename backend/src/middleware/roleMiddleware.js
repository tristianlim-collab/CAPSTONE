import { error } from "../utils/apiResponse.js";

const requireRole = (role) => (req, res, next) => {
	if (!req.user) {
		return res.status(401).json(error({ message: "Unauthorized" }));
	}

	if (req.user.role !== role) {
		return res.status(403).json(error({ message: "Forbidden" }));
	}

	return next();
};

export const requireAdmin = requireRole("ADMIN");
export const requireResponseUnit = requireRole("RESPONSE_UNIT");
export const requireReporter = requireRole("REPORTER");

export default requireRole;
