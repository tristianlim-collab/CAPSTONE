import { prisma } from '../config/database.js';
import { success, error } from "../utils/apiResponse.js";
import { triggerMultiChannelAlert } from "../services/alertService.js";



export const listNotifications = async (_req, res) => {
  try {
    const data = await prisma.notification.findMany({ orderBy: { sent_at: "desc" } });
    return res.status(200).json(success({ data, message: "Notifications fetched" }));
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
        assigned_by: req.user?.user_id || null,
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