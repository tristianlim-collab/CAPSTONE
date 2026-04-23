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
        barangay_id: detectedBarangayId,
        status: 'REPORTED' // Explicitly set to REPORTED - requires admin verification before dispatch
      },
      include: {
        incident_type: true,
        barangay: true,
        reporter: { select: { name: true, email: true, contact_number: true } },
        evidence: true
      }
    });

    // DISABLED AUTO-DISPATCH: Incidents now require admin verification before unit assignment
    // This prevents false reports from wasting response unit resources
    // Admins can approve, reject, or request more info via POST /api/incidents/:id/verify

    // Broadcast to admin room so they see pending incidents awaiting verification
    socketService.emitIncidentAwaitingVerification(incident);

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

/**
 * Verify incident (admin action)
 * POST /api/incidents/:id/verify
 * Body: { action: 'APPROVE'|'REJECT'|'REQUEST_INFO', message?: string, edited_data?: {...} }
 */
export const verifyIncident = async (req, res) => {
  try {
    const { action, message, edited_data } = req.body;
    const incident_id = req.params.id;

    // Verify admin role
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can verify incidents' });
    }

    const incident = await prisma.incident.findUnique({
      where: { incident_id },
      include: { incident_type: true, reporter: true, assignments: true, evidence: true }
    });

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    if (incident.status !== 'REPORTED') {
      return res.status(400).json({ message: 'Incident must be in REPORTED status to verify' });
    }

    if (action === 'APPROVE') {
      // Update incident with edited data if provided
      if (edited_data) {
        await prisma.incident.update({
          where: { incident_id },
          data: {
            incident_type_id: edited_data.incident_type_id || incident.incident_type_id,
            severity: edited_data.severity || incident.severity,
            description: edited_data.description || incident.description,
            latitude: edited_data.latitude || incident.latitude,
            longitude: edited_data.longitude || incident.longitude,
            map_pin_address: edited_data.map_pin_address || incident.map_pin_address
          }
        });
      }

      // Determine target unit type
      let targetUnitType = 'BARANGAY';
      const incidentType = await prisma.incidentType.findUnique({
        where: { type_id: edited_data?.incident_type_id || incident.incident_type_id }
      });

      if (incidentType) {
        const name = incidentType.name.toUpperCase();
        if (name.includes('FIRE')) targetUnitType = 'FIRE';
        else if (name.includes('POLICE') || name.includes('CRIME')) targetUnitType = 'POLICE';
        else if (name.includes('MEDICAL') || name.includes('EMERGENCY') || name.includes('HEALTH')) targetUnitType = 'MEDICAL';
        else if (name.includes('DRRMO') || name.includes('DISASTER')) targetUnitType = 'DRRMO';
      }

      // Find nearest units and assign
      const nearestUnits = await geoService.findNearestUnits(
        edited_data?.latitude || incident.latitude,
        edited_data?.longitude || incident.longitude,
        1,
        targetUnitType
      );

      const assignments = [];
      if (nearestUnits && nearestUnits.length > 0) {
        for (const unit of nearestUnits) {
          const assignment = await prisma.incidentAssignment.create({
            data: {
              incident_id,
              unit_id: unit.unit_id,
              assigned_by: req.user.id,
              status: 'PENDING'
            },
            include: { unit: true }
          });

          // Create notification
          await prisma.notification.create({
            data: {
              incident_id,
              unit_id: unit.unit_id,
              channel: 'DASHBOARD',
              message_body: `New Dispatch (Verified): ${incident.incident_code}`,
              delivery_status: 'SENT'
            }
          });

          assignments.push(assignment);

          // Alert unit
          await alertService.notifyUnitDispatch(incident, unit, assignment, null)
            .catch(err => console.error('Alert error:', err));
        }
      }

      // Update incident status to VERIFIED
      const updatedIncident = await prisma.incident.update({
        where: { incident_id },
        data: { status: 'VERIFIED' },
        include: { incident_type: true, reporter: true, assignments: true }
      });

      // Log status change
      await prisma.incidentStatusLog.create({
        data: {
          incident_id,
          changed_by: req.user.id,
          status: 'VERIFIED',
          remarks: `Approved by admin and dispatched to units`
        }
      });

      // Broadcast verification event
      socketService.emitIncidentVerified(updatedIncident, assignments);

      res.json({
        message: 'Incident approved and dispatched',
        incident: updatedIncident,
        assignments
      });

    } else if (action === 'REJECT') {
      // Reject incident
      const updatedIncident = await prisma.incident.update({
        where: { incident_id },
        data: { status: 'FALSE_ALARM' },
        include: { incident_type: true, reporter: true }
      });

      // Log status change
      await prisma.incidentStatusLog.create({
        data: {
          incident_id,
          changed_by: req.user.id,
          status: 'FALSE_ALARM',
          remarks: message || 'Marked as false alarm by admin'
        }
      });

      // Notify reporter
      await prisma.notification.create({
        data: {
          user_id: incident.reported_by,
          incident_id,
          channel: 'DASHBOARD',
          message_body: `Your report (${incident.incident_code}) was marked as a false alarm`,
          delivery_status: 'SENT'
        }
      });

      // Broadcast rejection event
      socketService.emitIncidentRejected(updatedIncident);

      res.json({
        message: 'Incident rejected',
        incident: updatedIncident
      });

    } else if (action === 'REQUEST_INFO') {
      // Request more info from reporter
      await prisma.notification.create({
        data: {
          user_id: incident.reported_by,
          incident_id,
          channel: 'DASHBOARD',
          message_body: message || 'Admin is requesting more information about your incident',
          delivery_status: 'SENT'
        }
      });

      // Broadcast event
      socketService.emitMoreInfoRequested(incident, message);

      res.json({
        message: 'More info requested from reporter',
        incident
      });

    } else {
      res.status(400).json({ message: 'Invalid action. Must be APPROVE, REJECT, or REQUEST_INFO' });
    }
  } catch (error) {
    console.error('verifyIncident error:', error);
    res.status(500).json({ message: 'Error verifying incident', error: error.message });
  }
};

/**
 * Edit incident details (admin only, before verification)
 * PATCH /api/incidents/:id/edit
 * Body: { incident_type_id, severity, description, latitude, longitude, map_pin_address }
 */
export const editIncident = async (req, res) => {
  try {
    const { incident_type_id, severity, description, latitude, longitude, map_pin_address } = req.body;
    const incident_id = req.params.id;

    // Verify admin role
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can edit incidents' });
    }

    const incident = await prisma.incident.findUnique({
      where: { incident_id }
    });

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    if (incident.status !== 'REPORTED') {
      return res.status(400).json({ message: 'Can only edit incidents in REPORTED status' });
    }

    // Update incident
    const updatedIncident = await prisma.incident.update({
      where: { incident_id },
      data: {
        incident_type_id: incident_type_id || incident.incident_type_id,
        severity: severity || incident.severity,
        description: description || incident.description,
        latitude: latitude || incident.latitude,
        longitude: longitude || incident.longitude,
        map_pin_address: map_pin_address || incident.map_pin_address
      },
      include: {
        incident_type: true,
        reporter: true,
        barangay: true,
        evidence: true
      }
    });

    // Log edit
    await prisma.incidentStatusLog.create({
      data: {
        incident_id,
        changed_by: req.user.id,
        status: 'REPORTED',
        remarks: 'Incident details edited by admin'
      }
    });

    res.json({
      message: 'Incident updated',
      incident: updatedIncident
    });
  } catch (error) {
    console.error('editIncident error:', error);
    res.status(500).json({ message: 'Error editing incident', error: error.message });
  }
};
