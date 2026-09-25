import { prisma } from '../config/database.js';
import socketService from '../services/socketService.js';
import geoService from '../services/geoService.js';
import bcrypt from 'bcryptjs';
import { logAuditEvent } from './auditController.js';


export const getAll = async (req, res) => {
  try {
    const units = await prisma.responseUnit.findMany({
      include: {
        barangay: {
          select: {
            barangay_id: true,
            name: true,
            municipality: true,
            city: true,
            congressional_district: true
          }
        }
      }
    });
    res.json(units);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching', error: error.message });
  }
};

export const create = async (req, res) => {
  try {
    let { unit_name, unit_type, contact_number, barangay_id, latitude, longitude, map_pin_address } = req.body;
    
    // Auto-detect the Barangay based on coordinates ONLY if coordinates are manually provided
    if (!barangay_id && latitude && longitude) {
      barangay_id = await geoService.findBarangayByPoint(latitude, longitude, map_pin_address);
    }

    // 1. Create the physical Response Unit
    const unit = await prisma.responseUnit.create({
      data: { unit_name, unit_type, contact_number, barangay_id, latitude, longitude }
    });

    // 2. Automatically create a User account for this unit to log in with
    const formattedName = unit_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    // E.g., "Fire Station 1" becomes "fire-station-1@gaoirs.com"
    const autoEmail = `${formattedName}@gaoirs.com`;
    const defaultPassword = 'password123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    await prisma.user.create({
      data: {
        name: unit_name,
        email: autoEmail,
        password_hash: hashedPassword,
        role: 'RESPONSE_UNIT',
        contact_number,
        unit_id: unit.unit_id
      }
    });

    // Return the unit and the generated login details (to possibly show the admin in the frontend later)
    res.status(201).json({
      ...unit,
      temp_account: {
        email: autoEmail,
        password: defaultPassword
      }
    });

    // Log the creation
    await logAuditEvent({
      user_id: req.user.id,
      action: 'CREATED_UNIT',
      resource: 'RESPONSE_UNIT',
      resource_id: unit.unit_id,
      details: `Created new ${unit_type} unit: ${unit_name}`,
      ip_address: req.ip
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating', error: error.message });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, map_pin_address } = req.body;
    
    // Auto-detect the Barangay based on the new map pin
    let detectedId = null;
    if (latitude !== undefined && longitude !== undefined) {
      detectedId = await geoService.findBarangayByPoint(latitude, longitude, map_pin_address);
    }

    const data = { latitude, longitude, last_updated: new Date() };
    // Update the barangay_id if a valid one was detected or set to null if unassigned
    if (detectedId) {
      data.barangay_id = detectedId;
    }

    const unit = await prisma.responseUnit.update({
      where: { unit_id: req.params.id },
      data,
      include: { barangay: true }
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
    const { unit_name, unit_type, contact_number, barangay_id, latitude, longitude, map_pin_address } = req.body;
    const data = {};
    if (unit_name !== undefined) data.unit_name = unit_name;
    if (unit_type !== undefined) data.unit_type = unit_type;
    if (contact_number !== undefined) data.contact_number = contact_number;
    
    if (latitude !== undefined) data.latitude = latitude;
    if (longitude !== undefined) data.longitude = longitude;

    // Auto-detect the Barangay based on the map pin if coordinates are provided
    if (latitude && longitude && !barangay_id) {
      const detectedId = await geoService.findBarangayByPoint(latitude, longitude, map_pin_address);
      if (detectedId) {
        data.barangay_id = detectedId;
      }
    } else if (barangay_id !== undefined) {
      data.barangay_id = barangay_id;
    }

    const unit = await prisma.responseUnit.update({
      where: { unit_id: req.params.id },
      data
    });
    res.json(unit);

    // Log the update
    await logAuditEvent({
      user_id: req.user.id,
      action: 'UPDATED_UNIT',
      resource: 'RESPONSE_UNIT',
      resource_id: unit.unit_id,
      details: `Updated details for unit: ${unit.unit_name}`,
      ip_address: req.ip
    });

  } catch (error) {
    res.status(500).json({ message: 'Error updating unit', error: error.message });
  }
};

export const deleteUnit = async (req, res) => {
  try {
    const unitId = req.params.id;
    const unit = await prisma.responseUnit.findUnique({
      where: { unit_id: unitId },
      include: { users: true }
    });
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    // Unlink any users assigned to this unit first
    await prisma.user.updateMany({
      where: { unit_id: unitId },
      data: { unit_id: null }
    });

    // For linked auto-generated response unit users, try deleting them safely if they have no audit/status log dependencies
    if (unit.users && unit.users.length > 0) {
      for (const u of unit.users) {
        try {
          await prisma.$transaction([
            prisma.incident.updateMany({ where: { reported_by: u.user_id }, data: { reported_by: null } }),
            prisma.evidence.updateMany({ where: { uploaded_by: u.user_id }, data: { uploaded_by: null } }),
            prisma.notification.updateMany({ where: { assigned_by: u.user_id }, data: { assigned_by: null } }),
            prisma.systemConfig.updateMany({ where: { updated_by: u.user_id }, data: { updated_by: null } }),
            prisma.user.delete({ where: { user_id: u.user_id } })
          ]);
        } catch (uErr) {
          // If user cannot be hard deleted due to audit/incident history, soft delete / deactivate it
          console.warn(`User ${u.user_id} could not be hard deleted:`, uErr.message);
          await prisma.user.update({
            where: { user_id: u.user_id },
            data: { is_active: false }
          });
        }
      }
    }

    // Clean up notifications and incident assignments linked to this unit
    await prisma.notification.updateMany({ where: { unit_id: unitId }, data: { unit_id: null } });
    await prisma.incidentAssignment.deleteMany({ where: { unit_id: unitId } });

    // Finally delete the response unit
    await prisma.responseUnit.delete({ where: { unit_id: unitId } });

    // Emit socket event for deletion
    socketService.emitResponseUnitDeleted(unitId);

    res.json({ message: 'Deleted successfully' });

    // Log the deletion
    await logAuditEvent({
      user_id: req.user.id,
      action: 'DELETED_UNIT',
      resource: 'RESPONSE_UNIT',
      resource_id: unitId,
      details: `Deleted response unit: ${unit.unit_name}`,
      ip_address: req.ip
    });

  } catch (error) {
    console.error('deleteUnit error:', error);
    res.status(500).json({ message: error.message || 'Error deleting unit' });
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
