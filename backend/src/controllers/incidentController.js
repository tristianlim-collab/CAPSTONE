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

    // Automatically emit socket event
    socketService.emitNewIncident(incident);

    res.status(201).json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Error creating incident', error: error.message });
  }
};

export const getIncidents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
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
      // Map to limit Response Unit viewing solely to their own unit's dispatches.
      where.assignments = {
        some: {
          unit: {
            users: { some: { user_id: req.user.id } }
          }
        }
      };
    }

    const incidents = await prisma.incident.findMany({
      where, skip, take: limit,
      include: {
        incident_type: true,
        barangay: true,
        reporter: { select: { name: true, email: true, contact_number: true } }
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
      include: { reporter: true }
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
