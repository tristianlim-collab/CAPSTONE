import { prisma } from '../config/database.js';
import socketService from '../services/socketService.js';
export const getAll = async (req, res) => {
  try {
    const units = await prisma.responseUnit.findMany({
      include: { barangay: true }
    });
    res.json(units);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching', error: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const { unit_name, unit_type, contact_number, barangay_id, latitude, longitude } = req.body;
    const unit = await prisma.responseUnit.create({
      data: { unit_name, unit_type, contact_number, barangay_id, latitude, longitude }
    });
    res.status(201).json(unit);
  } catch (error) {
    res.status(500).json({ message: 'Error creating', error: error.message });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const unit = await prisma.responseUnit.update({
      where: { unit_id: req.params.id },
      data: { latitude, longitude, last_updated: new Date() }
    });
    // Broadcast location update to all connected clients
    socketService.emitUnitLocationUpdate(unit.unit_id, unit.latitude, unit.longitude, unit.unit_name);
    res.json(unit);
  } catch (error) {
    res.status(500).json({ message: 'Error updating location', error: error.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const unit = await prisma.responseUnit.update({
      where: { unit_id: req.params.id },
      data: { availability_status: status, last_updated: new Date() }
    });
    res.json(unit);
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
};

export const updateUnit = async (req, res) => {
  try {
    const { unit_name, unit_type, contact_number, barangay_id, latitude, longitude } = req.body;
    const data = {};
    if (unit_name !== undefined) data.unit_name = unit_name;
    if (unit_type !== undefined) data.unit_type = unit_type;
    if (contact_number !== undefined) data.contact_number = contact_number;
    if (barangay_id !== undefined) data.barangay_id = barangay_id;
    if (latitude !== undefined) data.latitude = latitude;
    if (longitude !== undefined) data.longitude = longitude;

    const unit = await prisma.responseUnit.update({
      where: { unit_id: req.params.id },
      data
    });
    res.json(unit);
  } catch (error) {
    res.status(500).json({ message: 'Error updating unit', error: error.message });
  }
};

export const deleteUnit = async (req, res) => {
  try {
    const unitId = req.params.id;
    await prisma.responseUnit.delete({ where: { unit_id: unitId } });

    // Emit socket event for deletion
    socketService.emitResponseUnitDeleted(unitId);

    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting unit', error: error.message });
  }
};

export const getActiveUnitPositions = async (req, res) => {
  try {
    const units = await prisma.responseUnit.findMany({
      where: {
        availability_status: {
          not: 'OFFLINE'
        }
      },
      select: {
        unit_id: true,
        unit_name: true,
        unit_type: true,
        latitude: true,
        longitude: true,
        availability_status: true
      }
    });
    res.json(units);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active units', error: error.message });
  }
};

/**
 * Get unit activity history (assignments and statistics)
 * GET /api/response-units/:id/history?page=1&limit=50
 */
export const getUnitActivityHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Validate unit exists
    const unit = await prisma.responseUnit.findUnique({ where: { unit_id: id } });
    if (!unit) return res.status(404).json({ message: 'Unit not found' });

    // Fetch assignments with incident details
    const assignments = await prisma.incidentAssignment.findMany({
      where: { unit_id: id },
      include: {
        incident: { include: { incident_type: true, barangay: true } },
        assigned_by_user: { select: { name: true } }
      },
      orderBy: { assigned_at: 'desc' },
      skip,
      take: limit
    });

    // Fetch total count
    const total = await prisma.incidentAssignment.count({ where: { unit_id: id } });

    // Calculate stats
    const stats = await prisma.incidentAssignment.aggregate({
      where: { unit_id: id },
      _count: { assignment_id: true },
      _max: { resolved_at: true },
      _min: { assigned_at: true }
    });

    // Calculate response times for resolved assignments
    const resolved = await prisma.incidentAssignment.findMany({
      where: { unit_id: id, resolved_at: { not: null } },
      select: { acknowledged_at: true, arrived_at: true, resolved_at: true, assigned_at: true }
    });

    const avgResponseTime = resolved.length > 0
      ? resolved.reduce((sum, a) => {
          const responseTime = a.acknowledged_at
            ? (a.acknowledged_at.getTime() - a.assigned_at.getTime()) / 1000 / 60 // minutes
            : 0;
          return sum + responseTime;
        }, 0) / resolved.length
      : 0;

    res.json({
      success: true,
      unit: { unit_id: unit.unit_id, unit_name: unit.unit_name, unit_type: unit.unit_type },
      stats: {
        total_assignments: stats._count.assignment_id,
        resolved_count: resolved.length,
        average_response_time_minutes: Math.round(avgResponseTime),
        first_assignment: stats._min.assigned_at,
        last_assignment: stats._max.resolved_at
      },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      history: assignments
    });
  } catch (error) {
    console.error('Unit history error:', error);
    res.status(500).json({ message: 'Failed to fetch unit history', error: error.message });
  }
};
