import { prisma } from '../config/database.js';
import { success, error } from "../utils/apiResponse.js";



export const getSummary = async (_req, res) => {
  try {
    const [total, active, resolved, users] = await Promise.all([
      prisma.incident.count(),
      prisma.incident.count({ where: { status: { in: ["REPORTED", "VERIFIED", "RESPONDING"] } } }),
      prisma.incident.count({ where: { status: { in: ["RESOLVED", "CLOSED"] } } }),
      prisma.user.count(),
    ]);

    return res.status(200).json(success({ data: { total, active, resolved, users }, message: "Analytics summary fetched" }));
  } catch (err) {
    return res.status(500).json(error({ message: err.message }));
  }
};

export const getByType = async (_req, res) => {
  try {
    const rows = await prisma.incident.groupBy({ by: ["incident_type_id"], _count: { _all: true } });
    return res.status(200).json(success({ data: rows, message: "Analytics by type fetched" }));
  } catch (err) {
    return res.status(500).json(error({ message: err.message }));
  }
};

export const getByBarangay = async (_req, res) => {
  try {
    const rows = await prisma.incident.groupBy({ by: ["barangay_id"], _count: { _all: true } });
    return res.status(200).json(success({ data: rows, message: "Analytics by barangay fetched" }));
  } catch (err) {
    return res.status(500).json(error({ message: err.message }));
  }
};

export const getTrend = async (_req, res) => {
  try {
    const incidents = await prisma.incident.findMany({ select: { reported_at: true } });
    const buckets = incidents.reduce((acc, row) => {
      const key = row.reported_at.toISOString().slice(0, 10);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const data = Object.entries(buckets).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
    return res.status(200).json(success({ data, message: "Trend analytics fetched" }));
  } catch (err) {
    return res.status(500).json(error({ message: err.message }));
  }
};

export const getResponseTime = async (_req, res) => {
  try {
    const assignments = await prisma.incidentAssignment.findMany({ where: { acknowledged_at: { not: null }, resolved_at: { not: null } } });
    const minutes = assignments.map((a) => (new Date(a.resolved_at).getTime() - new Date(a.acknowledged_at).getTime()) / 60000);
    const avg = minutes.length ? minutes.reduce((sum, m) => sum + m, 0) / minutes.length : 0;
    return res.status(200).json(success({ data: { average_minutes: Number(avg.toFixed(2)) }, message: "Response time analytics fetched" }));
  } catch (err) {
    return res.status(500).json(error({ message: err.message }));
  }
};

export const getHeatmap = async (_req, res) => {
  try {
    const points = await prisma.incident.findMany({ select: { latitude: true, longitude: true, severity: true } });
    const data = points.map((p) => [p.latitude, p.longitude, p.severity === "CRITICAL" ? 1 : 0.6]);
    return res.status(200).json(success({ data, message: "Heatmap data fetched" }));
  } catch (err) {
    return res.status(500).json(error({ message: err.message }));
  }
};

export const getPeakHours = async (_req, res) => {
  try {
    const incidents = await prisma.incident.findMany({ select: { reported_at: true } });
    const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
    incidents.forEach((item) => {
      const hour = new Date(item.reported_at).getHours();
      buckets[hour].count += 1;
    });
    return res.status(200).json(success({ data: buckets, message: "Peak hours fetched" }));
  } catch (err) {
    return res.status(500).json(error({ message: err.message }));
  }
};