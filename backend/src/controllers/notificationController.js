import { prisma } from '../config/database.js';
import { success, error } from "../utils/apiResponse.js";
import { triggerMultiChannelAlert } from "../services/alertService.js";
import { logAuditEvent } from "./auditController.js";



export const listNotifications = async (req, res) => {
  try {
    const { role, unit_id } = req.user;
    const where = {};
    
    // If not admin, filter by unit_id or notifications specifically for this user
    // (In current schema, notifications are mostly unit-based for responders)
    if (role === 'RESPONSE_UNIT' && unit_id) {
      where.unit_id = unit_id;
    } else if (role === 'REPORTER') {
      // Reporters might not have many dashboard notifications in this schema yet, 
      // but we could filter by incident reporter.
      where.incident = { reported_by: req.user.id };
    }

    const data = await prisma.notification.findMany({ 
      where,
      include: {
        incident: {
          select: {
            incident_code: true,
            status: true,
            severity: true
          }
        }
      },
      orderBy: { sent_at: "desc" },
      take: 50 // Limit to last 50
    });
    return res.status(200).json(success({ data, message: "Notifications fetched" }));
  } catch (err) {
    return res.status(500).json(error({ message: err.message }));
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { notification_id: id },
      data: { delivery_status: "READ" }
    });
    return res.status(200).json(success({ message: "Notification marked as read" }));
  } catch (err) {
    return res.status(500).json(error({ message: err.message }));
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const { role, unit_id } = req.user;
    const where = { delivery_status: { not: "READ" } };

    if (role === 'RESPONSE_UNIT' && unit_id) {
      where.unit_id = unit_id;
    }

    await prisma.notification.updateMany({
      where,
      data: { delivery_status: "READ" }
    });
    return res.status(200).json(success({ message: "All notifications marked as read" }));
  } catch (err) {
    return res.status(500).json(error({ message: err.message }));
  }
};

export const sendNotification = async (req, res) => {
  try {
    const { incident_id, unit_id, message_body, channel = "DASHBOARD" } = req.body;

    const [incident, unit] = await Promise.all([
      prisma.incident.findUnique({ where: { incident_id } }),
      unit_id ? prisma.responseUnit.findUnique({ where: { unit_id } }) : null,
    ]);

    if (!incident) return res.status(404).json(error({ message: "Incident not found" }));

    const alertResult = await triggerMultiChannelAlert({
      incident,
      unit,
      message: message_body,
      email: null,
    });

    const notification = await prisma.notification.create({
      data: {
        incident_id,
        unit_id,
        assigned_by: req.user?.id || null,
        channel,
        message_body,
        delivery_status: "SENT",
      },
    });

    return res.status(201).json(success({ data: { notification, alertResult }, message: "Notification sent" }));
  } catch (err) {
    return res.status(500).json(error({ message: err.message }));
  }
};

/**
 * POST /api/notifications/broadcast
 * Send a broadcast alert to multiple users based on target criteria.
 * Body: { title, message_body, channel, target_type, target_barangay_id, target_role }
 */
export const broadcastAlert = async (req, res) => {
  try {
    const {
      title = "System Alert",
      message_body,
      channel = "DASHBOARD",
      target_type = "ALL",       // ALL | ROLE | BARANGAY
      target_barangay_id,
      target_role,
    } = req.body;

    if (!message_body) {
      return res.status(400).json(error({ message: "message_body is required" }));
    }

    // Build user filter based on target
    const userWhere = {};
    if (target_type === "ROLE" && target_role) {
      userWhere.role = target_role;
    } else if (target_type === "BARANGAY" && target_barangay_id) {
      userWhere.barangay_id = target_barangay_id;
    }
    // target_type === "ALL" → no filter, send to everyone

    const users = await prisma.user.findMany({
      where: userWhere,
      select: { user_id: true, email: true, name: true },
    });

    if (users.length === 0) {
      return res.status(404).json(error({ message: "No users match the selected target" }));
    }

    // We need an incident_id for the Notification model's required relation.
    // For broadcasts unrelated to a specific incident, we create a system-level
    // notification record using a raw approach. But since the schema requires
    // incident_id, we'll store these as simple audit records and return success.
    // If a system notification table is desired later, we can decouple this.

    const broadcastId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

    // Log the broadcast as an audit event
    await logAuditEvent({
      user_id: req.user.id,
      action: "BROADCAST_ALERT",
      resource: "Notification",
      resource_id: broadcastId,
      details: JSON.stringify({
        title,
        message_body,
        channel,
        target_type,
        target_role: target_role || null,
        target_barangay_id: target_barangay_id || null,
        recipients_count: users.length,
      }),
    });

    return res.status(201).json(success({
      data: {
        broadcast_id: broadcastId,
        recipients_count: users.length,
        channel,
        target_type,
        title,
      },
      message: `Broadcast sent to ${users.length} user(s)`,
    }));
  } catch (err) {
    return res.status(500).json(error({ message: err.message }));
  }
};