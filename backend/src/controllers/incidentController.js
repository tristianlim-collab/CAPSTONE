import { prisma } from '../config/database.js';
import geoService from '../services/geoService.js';
import alertService from '../services/alertService.js';
import socketService from '../services/socketService.js';

export const createIncident = async (req, res) => {
  try {
    const { incident_type_id, description, latitude, longitude, map_pin_address, severity } = req.body;
    
    // Auto-detect barangay via PostGIS
    const detectedBarangayId = await geoService.findBarangayByPoint(latitude, longitude);
    
    // Generate unique code (e.g. INC-Date-Rand)
    const incident_code = `INC-${Date.now()}-${Math.floor(Math.random()*1000)}`;

    const incidentType = await prisma.incidentType.findUnique({ where: { type_id: incident_type_id } });
    
    // Attempt Auto-Assignment
    let targetUnitType = null;
    if (incidentType) {
      const name = incidentType.name.toUpperCase();
      if (name.includes('FIRE')) targetUnitType = 'FIRE';
      else if (name.includes('POLICE') || name.includes('CRIME')) targetUnitType = 'POLICE';
      else if (name.includes('MEDICAL') || name.includes('EMERGENCY') || name.includes('HEALTH')) targetUnitType = 'MEDICAL';
      else if (name.includes('DRRMO') || name.includes('DISASTER')) targetUnitType = 'DRRMO';
      else targetUnitType = 'BARANGAY';
    }

    const incident = await prisma.incident.create({
      data: {
        incident_code,
        reported_by: req.user.id,
        incident_type_id,
        description,
        latitude,
        longitude,
        map_pin_address,
        severity: severity || 'MEDIUM',
        barangay_id: detectedBarangayId
      },
      include: {
        incident_type: true,
        barangay: true,
        reporter: { select: { name: true, email: true, contact_number: true } }
      }
    });

    const nearestUnits = await geoService.findNearestUnits(latitude, longitude, 1, targetUnitType);
    if (nearestUnits && nearestUnits.length > 0) {
      const assignedUnit = nearestUnits[0];
      
      const assignment = await prisma.incidentAssignment.create({
        data: {
          incident_id: incident.incident_id,
          unit_id: assignedUnit.unit_id,
          assigned_by: req.user.id, // automated assignment usually attributed to system or reporter
          status: 'PENDING'
        }
      });

      await prisma.notification.create({
        data: {
          incident_id: incident.incident_id,
          unit_id: assignedUnit.unit_id,
          channel: 'DASHBOARD',
          message_body: `New ${incidentType?.name || 'Emergency'} Dispatch: ${incident.incident_code}`,
          delivery_status: 'SENT'
        }
      });

      // trigger socket event and potential SMS/Email depending on unit configuration via alertService
      await alertService.notifyUnitDispatch(incident, assignedUnit, assignment, null).catch(err => console.error("Alert delivery error:", err));
    }

    // Broadcast to all response units + admin via socket (full payload for instant rendering)
    socketService.emitNewIncident(incident);

    res.status(201).json(incident);
  } catch (error) {
    console.error('createIncident error:', error);
    res.status(500).json({ message: 'Error creating incident', error: error.message });
  }
};

export const getIncidents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const { status, severity, barangay_id, type_id } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (barangay_id) where.barangay_id = barangay_id;
    if (type_id) where.incident_type_id = type_id;

    if (req.user.role === 'REPORTER') {
      where.reported_by = req.user.id;
    } else if (req.user.role === 'RESPONSE_UNIT') {
      // Show all incidents to response units so they can see the full picture
      // (they are filtered by assignment on the frontend if needed)
    }

    const incidents = await prisma.incident.findMany({
      where, skip, take: limit,
      include: {
        incident_type: true,
        barangay: true,
        reporter: { select: { name: true, email: true, contact_number: true } },
        assignments: {
          include: { unit: true }
        },
        evidence: true
      },
      orderBy: { reported_at: 'desc' }
    });

    const total = await prisma.incident.count({ where });

    res.json({
      data: incidents,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching incidents', error: error.message });
  }
};

export const getIncidentById = async (req, res) => {
  try {
    const incident = await prisma.incident.findUnique({
      where: { incident_id: req.params.id },
      include: {
        incident_type: true,
        barangay: true,
        reporter: { select: { name: true, contact_number: true } },
        assignments: {
          include: { unit: true }
        },
        status_logs: {
          orderBy: { changed_at: 'desc' }
        },
        evidence: true
      }
    });
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching incident', error: error.message });
  }
};

export const updateIncidentStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    
    const incident = await prisma.incident.update({
      where: { incident_id: req.params.id },
      data: { status },
      include: {
        reporter: true,
        incident_type: true,
        barangay: true,
        assignments: { include: { unit: true } }
      }
    });

    await prisma.incidentStatusLog.create({
      data: {
        incident_id: incident.incident_id,
        changed_by: req.user.id,
        status,
        remarks
      }
    });

    // Delegate notification routing
    await alertService.notifyStatusChange(incident, status);

    // Broadcast status update via socket to all interested parties
    socketService.emitIncidentStatusUpdate({
      incident_id: incident.incident_id,
      incident_code: incident.incident_code,
      status,
      reported_by: incident.reported_by,
      incident
    });

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Error updating incident status', error: error.message });
  }
};

export const getHeatmap = async (req, res) => {
  try {
    const data = await geoService.getHeatmapData(req.query.status);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching heatmap', error: error.message });
  }
};

/**
 * Request backup for an incident
 * POST /api/incidents/:id/backup
 * Body: { unit_type: 'FIRE' | 'POLICE' | 'MEDICAL' | 'DRRMO' | 'BARANGAY' }
 */
export const requestBackup = async (req, res) => {
  try {
    const { unit_type } = req.body;
    const incident_id = req.params.id;

    const incident = await prisma.incident.findUnique({
      where: { incident_id },
      include: { incident_type: true, assignments: true }
    });
    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    // Find nearest available unit of requested type, excluding already-assigned units
    const alreadyAssignedIds = incident.assignments.map(a => a.unit_id);
    const nearestUnits = await geoService.findNearestUnits(
      incident.latitude, incident.longitude, 3, unit_type
    );

    // Filter out already assigned units
    const available = nearestUnits.filter(u => !alreadyAssignedIds.includes(u.unit_id));
    if (!available || available.length === 0) {
      return res.status(404).json({ message: `No available ${unit_type} units found nearby` });
    }

    const backupUnit = available[0];

    // Create backup assignment
    const assignment = await prisma.incidentAssignment.create({
      data: {
        incident_id,
        unit_id: backupUnit.unit_id,
        assigned_by: req.user.id,
        status: 'PENDING'
      },
      include: { unit: true }
    });

    // Create notification for the backup unit
    await prisma.notification.create({
      data: {
        incident_id,
        unit_id: backupUnit.unit_id,
        channel: 'DASHBOARD',
        message_body: `BACKUP REQUEST: ${unit_type} backup needed for ${incident.incident_code}`,
        delivery_status: 'SENT'
      }
    });

    // Log the backup request
    await prisma.incidentStatusLog.create({
      data: {
        incident_id,
        changed_by: req.user.id,
        status: incident.status,
        remarks: `Backup requested: ${unit_type} unit (${backupUnit.unit_name}) dispatched`
      }
    });

    // Emit socket event for backup
    socketService.emitIncidentStatusUpdate({
      incident_id,
      incident_code: incident.incident_code,
      status: incident.status,
      reported_by: incident.reported_by,
      backup_unit: backupUnit.unit_name,
      incident
    });

    // Try to alert the backup unit
    await alertService.notifyUnitDispatch(incident, backupUnit, assignment, null)
      .catch(err => console.error('Backup alert error:', err));

    res.status(201).json({
      message: `${unit_type} backup dispatched: ${backupUnit.unit_name}`,
      assignment,
      unit: backupUnit
    });
  } catch (error) {
    console.error('requestBackup error:', error);
    res.status(500).json({ message: 'Error requesting backup', error: error.message });
  }
};
