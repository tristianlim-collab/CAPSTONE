import { prisma } from '../config/database.js';
import { success, error } from "../utils/apiResponse.js";

/**
 * Helper: Log an audit event. Call this from other controllers to record actions.
 */
export const logAuditEvent = async ({ user_id, action, resource, resource_id = null, details = null, ip_address = null }) => {
	try {
		await prisma.systemAuditLog.create({
			data: { user_id, action, resource, resource_id, details, ip_address },
		});
	} catch (err) {
		console.error("Audit log write failed:", err.message);
	}
};

/**
 * GET /api/audit
 * Fetch paginated audit logs with optional filters.
 */
export const listAuditLogs = async (req, res) => {
	try {
		const { page = 1, limit = 25, action, resource, user_id } = req.query;
		const skip = (Number(page) - 1) * Number(limit);

		const where = {};
		if (action) where.action = action;
		if (resource) where.resource = resource;
		if (user_id) where.user_id = user_id;

		const [data, total] = await Promise.all([
			prisma.systemAuditLog.findMany({
				where,
				orderBy: { created_at: "desc" },
				skip,
				take: Number(limit),
				include: {
					user: { select: { user_id: true, name: true, email: true, role: true } },
				},
			}),
			prisma.systemAuditLog.count({ where }),
		]);

		return res.status(200).json(success({
			data: { logs: data, total, page: Number(page), limit: Number(limit) },
			message: "Audit logs fetched",
		}));
	} catch (err) {
		return res.status(500).json(error({ message: err.message }));
	}
};

/**
 * GET /api/audit/actions
 * Return a distinct list of action types for filter dropdowns.
 */
export const listDistinctActions = async (_req, res) => {
	try {
		const actions = await prisma.systemAuditLog.findMany({
			distinct: ["action"],
			select: { action: true },
			orderBy: { action: "asc" },
		});
		return res.status(200).json(success({ data: actions.map(a => a.action) }));
	} catch (err) {
		return res.status(500).json(error({ message: err.message }));
	}
};
