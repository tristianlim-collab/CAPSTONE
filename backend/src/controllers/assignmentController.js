import { prisma } from '../config/database.js';
import geoService from '../services/geoService.js';
import alertService from '../services/alertService.js';
import socketService from '../services/socketService.js';

export const assignUnitToIncident = async (req, res) => {
  try {
    const { incident_id, status = 'PENDING' } = req.body;
    let { unit_id } = req.body;

    if (req.user.role === 'RESPONSE_UNIT') {
      if (!req.user.unit_id) return res.status(403).json({ message: 'User has no assigned unit' });
      unit_id = req.user.unit_id; // force self-assign
    } else if (!unit_id) {
      return res.status(400).json({ message: 'unit_id is required' });
    }
    
    // Prevent double assigning
    const existing = await prisma.incidentAssignment.findFirst({
      where: { incident_id, unit_id, status: { notIn: ['RESOLVED'] } }
    });
    
    if (existing) return res.status(400).json({ message: 'Unit already assigned' });

    const assignment = await prisma.incidentAssignment.create({
      data: {
        incident_id,
        unit_id,
        assigned_by: req.user.id,
        status, // allow passing initial status (e.g. ACCEPTED if self-assigning)
        acknowledged_at: status === 'ACCEPTED' ? new Date() : null
      },
      include: {
        unit: true,
        assigned_by_user: { select: { user_id: true, name: true, role: true } }
      }
    });

    const unit = await prisma.responseUnit.update({
      where: { unit_id },
      data: { availability_status: 'BUSY' }
    });

    // Notify the unit via SMS/Email/Socket
    const incident = await prisma.incident.findUnique({
      where: { incident_id },
      include: {
        reporter: true,
        incident_type: true,
        barangay: true
      }
    });

    if (status === 'ACCEPTED') {
      await prisma.incident.update({
        where: { incident_id },
        data: { status: 'VERIFIED' }
      });
      if (incident) incident.status = 'VERIFIED';
    } else {
      // If dispatching an unverified or responding incident, ensure incident status is updated to RESPONDING
      await prisma.incident.update({
        where: { incident_id },
        data: { status: 'RESPONDING' }
      });
      if (incident) incident.status = 'RESPONDING';
    }

    // Log the dispatch event to status logs for audit trail
    await prisma.incidentStatusLog.create({
      data: {
        incident_id,
        changed_by: req.user.id,
        status: incident?.status || 'RESPONDING',
        remarks: `Dispatched unit ${unit.unit_name} by ${req.user.name || 'Admin'} (${req.user.role || 'ADMIN'})`
      }
    });

    const destinationText = incident?.map_pin_address || incident?.landmark || (incident?.barangay?.name ? `Barangay ${incident.barangay.name}` : 'Incident Location');

    const enrichedAssignment = {
      ...assignment,
      responder_name: unit.unit_name,
      responder_type: unit.unit_type,
      responder_contact: unit.contact_number || 'N/A',
      dispatch_time: assignment.assigned_at,
      dispatch_status: assignment.status,
      destination: destinationText,
      destination_coordinates: incident ? { latitude: incident.latitude, longitude: incident.longitude } : null,
      dispatched_by: {
        user_id: req.user.id,
        name: req.user.name,
        role: req.user.role
      }
    };

    if (incident) {
      await alertService.notifyUnitDispatch(incident, unit, enrichedAssignment, req.user);
    }

    // Broadcast assignment via socket
    socketService.emitAssignment(unit_id, { incident, assignment: enrichedAssignment, unit });

    res.status(201).json(enrichedAssignment);
  } catch (error) {
    res.status(500).json({ message: 'Error assigning unit', error: error.message });
  }
};

export const getNearestUnits = async (req, res) => {
  try {
    const { incident_id, limit, unit_type } = req.query;
    const incident = await prisma.incident.findUnique({ where: { incident_id }});
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    
    const nearest = await geoService.findNearestUnits(
      incident.latitude, 
      incident.longitude, 
      parseInt(limit) || 5, 
      unit_type
    );
    
    res.json(nearest);
  } catch (error) {
    res.status(500).json({ message: 'Error finding nearest units', error: error.message });
  }
};

export const updateAssignmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updateData = { status };
    
    if (status === 'ACCEPTED') updateData.acknowledged_at = new Date();
    if (status === 'RESPONDING') updateData.acknowledged_at = updateData.acknowledged_at || new Date();
    if (status === 'RESOLVED') updateData.resolved_at = new Date();

    const assignment = await prisma.incidentAssignment.update({
      where: { assignment_id: req.params.id },
      data: updateData,
      include: {
        incident: {
          include: {
            incident_type: true,
            barangay: true,
            reporter: { select: { name: true, contact_number: true } }
          }
        },
        unit: true,
        assigned_by_user: { select: { user_id: true, name: true, role: true } }
      }
    });

    const destinationText = assignment.incident?.map_pin_address || assignment.incident?.landmark || (assignment.incident?.barangay?.name ? `Barangay ${assignment.incident.barangay.name}` : 'Incident Location');

    const enrichedAssignment = {
      ...assignment,
      responder_name: assignment.unit?.unit_name || 'Emergency Responder',
      responder_type: assignment.unit?.unit_type || 'BARANGAY',
      responder_contact: assignment.unit?.contact_number || 'N/A',
      dispatch_time: assignment.assigned_at,
      dispatch_status: assignment.status,
      destination: destinationText,
      destination_coordinates: assignment.incident ? { latitude: assignment.incident.latitude, longitude: assignment.incident.longitude } : null,
      dispatched_by: assignment.assigned_by_user ? {
        user_id: assignment.assigned_by_user.user_id,
        name: assignment.assigned_by_user.name,
        role: assignment.assigned_by_user.role
      } : null
    };

    // If the assignment status maps to an incident status, update the incident too
    const incidentStatusMap = {
      'ACCEPTED': 'VERIFIED',
      'RESPONDING': 'RESPONDING',
      'RESOLVED': 'RESOLVED'
    };

    if (incidentStatusMap[status]) {
      await prisma.incident.update({
        where: { incident_id: assignment.incident_id },
        data: { status: incidentStatusMap[status] }
      });

      // Log the status change
      await prisma.incidentStatusLog.create({
        data: {
          incident_id: assignment.incident_id,
          changed_by: req.user.id,
          status: incidentStatusMap[status],
          remarks: `Assignment status changed to ${status} by response unit`
        }
      });

      // Broadcast status update
      socketService.emitIncidentStatusUpdate({
        incident_id: assignment.incident_id,
        incident_code: assignment.incident.incident_code,
        status: incidentStatusMap[status],
        reported_by: assignment.incident.reported_by,
        incident: { ...assignment.incident, status: incidentStatusMap[status] }
      });
    }

    if (status === 'RESOLVED') {
      await prisma.responseUnit.update({
        where: { unit_id: assignment.unit_id },
        data: { availability_status: 'AVAILABLE' }
      });
      // Notify admin/response dashboards of unit availability change
      socketService.emitUnitAvailabilityChanged(assignment.unit_id, 'AVAILABLE');
    }

    res.json(enrichedAssignment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating assignment', error: error.message });
  }
};
