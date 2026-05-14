import { prisma } from '../config/database.js';
import geoService from '../services/geoService.js';
import alertService from '../services/alertService.js';
import socketService from '../services/socketService.js';

export const createIncident = async (req, res) => {
  try {
    const { incident_type_id, description, latitude, longitude, map_pin_address, severity, force_create, reporter_name, reporter_phone } = req.body;

    // --- Duplicate Detection ---
    // Check for similar incidents (same type + nearby location within 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentSimilar = await prisma.incident.findFirst({
      where: {
        incident_type_id,
        status: { not: 'FALSE_ALARM' },
        reported_at: { gte: fiveMinutesAgo },
        latitude: { gte: latitude - 0.001, lte: latitude + 0.001 },  // ~100m radius
        longitude: { gte: longitude - 0.001, lte: longitude + 0.001 }
      }
    });

    if (recentSimilar && !force_create) {
      return res.status(400).json({
        success: false,
        message: 'Similar incident already reported nearby within last 5 minutes',
        warning: true,
        existing_incident: {
          incident_id: recentSimilar.incident_id,
          incident_code: recentSimilar.incident_code,
          reported_at: recentSimilar.reported_at
        },
        shouldAllow: true
      });
    }

    // Auto-detect barangay via PostGIS
    const detectedBarangayId = await geoService.findBarangayByPoint(latitude, longitude);

    // Generate unique code (e.g. INC-Date-Rand)
    const incident_code = `INC-${Date.now()}-${Math.floor(Math.random()*1000)}`;

    const incidentType = await prisma.incidentType.findUnique({ where: { type_id: incident_type_id } });

    // Get the default response unit type from the incident type (configured in admin panel)
    const targetUnitType = incidentType?.default_unit_type || 'BARANGAY';

    const incident = await prisma.incident.create({
      data: {
        incident_code,
        reported_by: req.user.id,
        incident_type_id,
        description,
        latitude,
        longitude,
        map_pin_address,
        severity: severity || 'HIGH',
        barangay_id: detectedBarangayId,
        status: 'REPORTED', // Explicitly set to REPORTED - requires admin verification before dispatch
        reporter_name: reporter_name || null,  // Optional override from mobile form
        reporter_phone: reporter_phone || null  // Optional override from mobile form
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

    // Broadcast to admin + response rooms so they see the new incident and auto-zoom
    socketService.emitNewIncident(incident);
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

    const { status, severity, barangay_id, type_id, search, from_date, to_date } = req.query;

    const where = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (barangay_id) where.barangay_id = barangay_id;
    if (type_id) where.incident_type_id = type_id;

    // Date range filter
    if (from_date || to_date) {
      where.reported_at = {};
      if (from_date) where.reported_at.gte = new Date(from_date);
      if (to_date) where.reported_at.lte = new Date(to_date);
    }

    // Text search (incident code, description, reporter name, address)
    if (search) {
      where.OR = [
        { incident_code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { map_pin_address: { contains: search, mode: 'insensitive' } },
        { reporter: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (req.user.role === 'REPORTER') {
      // Reporters only see their own incidents
      where.reported_by = req.user.id;
    } else if (req.user.role === 'RESPONSE_UNIT') {
      // Response units ONLY see incidents that are VERIFIED or RESPONDING or RESOLVED
      // They should NOT see REPORTED (unverified) incidents
      if (!status) {
        where.status = {
          in: ['VERIFIED', 'RESPONDING', 'RESOLVED', 'CLOSED']
        };
      }
    }
    // ADMIN can see all incidents

    // Build include object based on ?include query param
    const includeParam = req.query.include?.split(',').map(s => s.trim()) || [];
    const includeObj = {
      incident_type: true,
      barangay: true,
      reporter: { select: { name: true, email: true, contact_number: true } },
      assignments: { include: { unit: { include: { barangay: true } } } },
      evidence: true
    };

    // Allow selective includes for performance - always keep core data
    if (includeParam.length > 0) {
      if (includeParam.includes('status_logs')) {
        includeObj.status_logs = { orderBy: { changed_at: 'desc' } };
      }
    }

    const incidents = await prisma.incident.findMany({
      where, skip, take: limit,
      include: includeObj,
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
    // Build include object based on ?include query param
    const includeParam = req.query.include?.split(',').map(s => s.trim()) || [];
    let includeObj = {
      incident_type: true,
      barangay: true,
      reporter: { select: { name: true, email: true, contact_number: true } },
      assignments: { include: { unit: true } },
      status_logs: { orderBy: { changed_at: 'desc' } },
      evidence: true
    };

    if (includeParam.length > 0) {
      includeObj = {
        incident_type: true,
        barangay: true,
        reporter: { select: { name: true, email: true, contact_number: true } },
        evidence: true,
        assignments: { include: { unit: true } }
      };
      // Only conditionally add status_logs if explicitly requested
      if (includeParam.includes('status_logs')) {
        includeObj.status_logs = { orderBy: { changed_at: 'desc' } };
      }
    }

    const incident = await prisma.incident.findUnique({
      where: { incident_id: req.params.id },
      include: includeObj
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

      // Determine target unit type from the incident type's configuration
      const incidentType = await prisma.incidentType.findUnique({
        where: { type_id: edited_data?.incident_type_id || incident.incident_type_id }
      });
      const targetUnitType = incidentType?.default_unit_type || 'BARANGAY';
      const incidentLat = edited_data?.latitude || incident.latitude;
      const incidentLng = edited_data?.longitude || incident.longitude;
      const incidentBarangayId = incident.barangay_id;

      // Determine how many units to assign based on severity
      // CRITICAL = up to 5 units, HIGH = up to 3 units, MEDIUM = 2 units, LOW = 1 unit
      const severityLimitMap = {
        CRITICAL: 5,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1
      };
      const unitsToAssign = severityLimitMap[incident.severity] || 1;

      // Use smart assignment to find best-matching units
      let assignedUnits = await geoService.findSmartResponseUnits(
        incidentLat,
        incidentLng,
        targetUnitType,
        incidentBarangayId,
        unitsToAssign
      );

      // Fallback: If no units of the target type, try finding ANY available unit
      if (!assignedUnits || assignedUnits.length === 0) {
        // Find nearest units of any type as fallback
        assignedUnits = await geoService.findNearestUnits(
          incidentLat,
          incidentLng,
          unitsToAssign
        );
      }

      const assignments = [];
      if (assignedUnits && assignedUnits.length > 0) {
        for (const unit of assignedUnits) {
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

      // Update incident status to RESPONDING
      const updatedIncident = await prisma.incident.update({
        where: { incident_id },
        data: { status: 'RESPONDING' },
        include: {
          incident_type: true,
          reporter: { select: { name: true, email: true, contact_number: true } },
          barangay: true,
          assignments: { include: { unit: { include: { barangay: true } } } },
          evidence: true
        }
      });

      // Log status change
      await prisma.incidentStatusLog.create({
        data: {
          incident_id,
          changed_by: req.user.id,
          status: 'RESPONDING',
          remarks: `Approved by admin and dispatched to units`
        }
      });

      // Broadcast verification event
      socketService.emitIncidentVerified(updatedIncident, assignments);

      // Emit dispatch-with-directions for each assigned unit that has a pinned base location
      for (const assignment of assignments) {
        const unit = assignment.unit;
        if (unit && unit.latitude && unit.longitude) {
          socketService.emitDispatchWithDirections(unit.unit_id, {
            unit_id: unit.unit_id,
            unit_name: unit.unit_name,
            incident_id: updatedIncident.incident_id,
            incident_code: updatedIncident.incident_code,
            incident_lat: incidentLat,
            incident_lng: incidentLng,
            unit_lat: unit.latitude,
            unit_lng: unit.longitude,
            distance_meters: assignment.distance_meters || null,
            incident_description: updatedIncident.description,
            incident_type: updatedIncident.incident_type?.name,
            severity: updatedIncident.severity,
            priority: updatedIncident.priority
          });
        }
      }

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

/**
 * Update incident priority (admin only)
 * PATCH /api/incidents/:id/priority
 * Body: { priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' }
 */
export const updateIncidentPriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (!['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
      return res.status(400).json({ message: 'Invalid priority level' });
    }

    // Validate admin role
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can update priority' });
    }

    // Validate incident exists
    const incident = await prisma.incident.findUnique({
      where: { incident_id: id },
      include: { incident_type: true, assignments: { include: { unit: true } } }
    });
    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    // Update priority
    const updated = await prisma.incident.update({
      where: { incident_id: id },
      data: { priority },
      include: { incident_type: true, assignments: { include: { unit: true } } }
    });

    // Log change
    await prisma.incidentStatusLog.create({
      data: {
        incident_id: id,
        changed_by: req.user.id,
        status: incident.status,
        remarks: `Priority updated to ${priority}`
      }
    });

    // Emit socket event
    socketService.emitIncidentPriorityChanged(id, priority);

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('updateIncidentPriority error:', error);
    res.status(500).json({ message: 'Failed to update priority', error: error.message });
  }
};

/**
 * Escalate incident with automatic backup dispatch
 * POST /api/incidents/:id/escalate
 * Body: { unit_type?: 'FIRE'|'POLICE'|'MEDICAL'|'BARANGAY'|'DRRMO', additional_units_count?: 1-3 }
 */
export const escalateIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { unit_type, additional_units_count = 2 } = req.body;

    // Validate admin or response unit role
    if (!['ADMIN', 'RESPONSE_UNIT'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Validate incident exists
    const incident = await prisma.incident.findUnique({
      where: { incident_id: id },
      include: { incident_type: true, assignments: true }
    });
    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    // Find available units (exclude already assigned units)
    const assignedUnitIds = incident.assignments.map(a => a.unit_id);
    const nearestUnits = await geoService.findNearestUnits(
      incident.latitude,
      incident.longitude,
      additional_units_count || 2,
      unit_type || incident.incident_type.default_unit_type
    );

    // Filter out already assigned units
    const newUnits = nearestUnits
      .filter(u => !assignedUnitIds.includes(u.unit_id))
      .slice(0, additional_units_count);

    if (newUnits.length === 0) {
      return res.status(400).json({ message: 'No additional units available for escalation' });
    }

    // Auto-assign new units
    const newAssignments = [];

    for (const unit of newUnits) {
      const assignment = await prisma.incidentAssignment.create({
        data: {
          incident_id: id,
          unit_id: unit.unit_id,
          assigned_by: req.user.id,
          status: 'PENDING'
        },
        include: { unit: true, incident: { include: { incident_type: true } } }
      });

      // Set unit to BUSY
      await prisma.responseUnit.update({
        where: { unit_id: unit.unit_id },
        data: { availability_status: 'BUSY' }
      });

      // Emit socket event for new assignment
      socketService.emitNewAssignment(unit.unit_id, {
        incident: assignment.incident,
        assignment,
        unit: assignment.unit
      });

      newAssignments.push(assignment);

      // Alert unit
      await alertService.notifyUnitDispatch(incident, unit, assignment, null)
        .catch(err => console.error('Escalation alert error:', err));
    }

    // Log escalation
    await prisma.incidentStatusLog.create({
      data: {
        incident_id: id,
        changed_by: req.user.id,
        status: incident.status,
        remarks: `Incident escalated - ${newUnits.length} additional units dispatched`
      }
    });

    // Emit escalation event
    socketService.emitIncidentEscalated(id, newAssignments);

    res.json({
      success: true,
      message: `${newUnits.length} backup units dispatched`,
      data: { incident, newAssignments }
    });
  } catch (error) {
    console.error('escalateIncident error:', error);
    res.status(500).json({ message: 'Failed to escalate incident', error: error.message });
  }
};

/**
 * Get incident hotspots (density clusters)
 * GET /api/incidents/analytics/hotspots?days=30&limit=50
 */
export const getIncidentHotspots = async (req, res) => {
  try {
    const { days = 30, limit = 50 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // PostGIS ST_ClusterKMeans for spatial clustering
    const hotspots = await prisma.$queryRaw`
      SELECT
        ST_ClusterKMeans(
          ST_SetSRID(ST_MakePoint(latitude, longitude), 4326),
          LEAST(CAST(${limit} AS INTEGER), GREATEST(1, (
            SELECT COUNT(*) / 100 + 1
            FROM "INCIDENT"
            WHERE status != 'FALSE_ALARM'
              AND reported_at >= ${startDate}
          )))
        ) OVER () as cluster_id,
        AVG(latitude)::FLOAT as center_lat,
        AVG(longitude)::FLOAT as center_lng,
        COUNT(*)::INTEGER as incident_count,
        ARRAY_AGG(incident_id) as incident_ids
      FROM "INCIDENT"
      WHERE status != 'FALSE_ALARM'
        AND reported_at >= ${startDate}
      GROUP BY cluster_id
      ORDER BY incident_count DESC
      LIMIT ${limit}
    `;

    res.json({
      success: true,
      days: parseInt(days),
      data: hotspots.map(h => ({
        center: { lat: Number(h.center_lat), lng: Number(h.center_lng) },
        count: h.incident_count,
        incident_ids: h.incident_ids,
        intensity: h.incident_count > 10 ? 'HIGH' : h.incident_count > 5 ? 'MEDIUM' : 'LOW'
      }))
    });
  } catch (error) {
    console.error('Hotspot calculation error:', error);
    res.status(500).json({ message: 'Failed to calculate hotspots', error: error.message });
  }
};
