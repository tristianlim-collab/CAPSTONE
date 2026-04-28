// Unified socket service — delegates to the single Socket.io instance in /socket.js
import { getIO, socketEvents } from '../../socket.js';

export default {
  getIO,

  /**
   * Broadcast a brand-new incident to every response-unit and admin dashboard.
   * Payload should include nested incident_type, reporter, barangay so the
   * frontend can render it without refetching.
   */
  emitNewIncident: (incident) => {
    try {
      const io = getIO();
      // Ensure complete data for map rendering
      const completeIncident = {
        ...incident,
        incident_id: incident.incident_id,
        incident_code: incident.incident_code,
        status: incident.status,
        latitude: incident.latitude,
        longitude: incident.longitude,
        description: incident.description,
        severity: incident.severity,
        map_pin_address: incident.map_pin_address,
        reported_at: incident.reported_at,
        incident_type: incident.incident_type,
        reporter: incident.reporter,
        barangay: incident.barangay,
        evidence: incident.evidence
      };
      // Send to admin room
      io.to('admin').emit('new_incident', completeIncident);
      // Send to the general response room (all response-unit users)
      io.to('response').emit('new_incident', completeIncident);
    } catch (err) {
      console.error('Socket emitNewIncident failed (socket may not be ready):', err.message);
    }
  },

  /**
   * Broadcast an incident status update to admin, reporter, and response rooms.
   */
  emitIncidentStatusUpdate: (data) => {
    try {
      const io = getIO();
      io.to('admin').emit('incident_status_updated', data);
      io.to('response').emit('incident_status_updated', data);
      // Also notify the specific reporter
      if (data.reported_by) {
        io.to(`reporter-${data.reported_by}`).emit('incident_status_updated', data);
      }
    } catch (err) {
      console.error('Socket emitIncidentStatusUpdate failed:', err.message);
    }
  },

  /**
   * Notify a specific unit about a new assignment.
   */
  emitAssignment: (unitId, data) => {
    try {
      const io = getIO();
      io.to(`unit-${unitId}`).emit('new_assignment', data);
      io.to('admin').emit('new_assignment', data);
      io.to('response').emit('new_assignment', data);
    } catch (err) {
      console.error('Socket emitAssignment failed:', err.message);
    }
  },

  /**
   * Broadcast a unit location update to admin and response-unit rooms.
   * Called when a response unit updates its GPS position.
   */
  emitUnitLocationUpdate: (unitId, lat, lng, unitName) => {
    try {
      const io = getIO();
      const payload = {
        unitId,
        lat,
        lng,
        unitName,
        timestamp: new Date()
      };
      io.to('admin').emit('unit_location_updated', payload);
      io.to('response').emit('unit_location_updated', payload);
    } catch (err) {
      console.error('Socket emitUnitLocationUpdate failed:', err.message);
    }
  },

  /**
   * Broadcast that an incident is awaiting admin verification.
   * Emitted when a reporter submits a new incident.
   */
  emitIncidentAwaitingVerification: (incident) => {
    try {
      const io = getIO();
      // Ensure complete incident data is included for map rendering
      io.to('admin').emit('incident_awaiting_verification', {
        incident_id: incident.incident_id,
        incident_code: incident.incident_code,
        type: incident.incident_type?.name,
        severity: incident.severity,
        location: incident.map_pin_address,
        description: incident.description,
        reported_at: incident.reported_at,
        reporter_name: incident.reporter?.name,
        status: incident.status,
        latitude: incident.latitude,
        longitude: incident.longitude,
        incident_type: incident.incident_type,
        barangay: incident.barangay,
        reporter: incident.reporter,
        evidence: incident.evidence,
        incident // Full incident object for map markers
      });
    } catch (err) {
      console.error('Socket emitIncidentAwaitingVerification failed:', err.message);
    }
  },

  /**
   * Broadcast that an incident has been verified and dispatched.
   * Emitted when admin approves an incident.
   */
  emitIncidentVerified: (incident, assignments) => {
    try {
      const io = getIO();
      io.to('admin').emit('incident_verified', {
        incident_id: incident.incident_id,
        incident_code: incident.incident_code,
        status: incident.status,
        assignments,
        incident
      });
      io.to('response').emit('incident_verified', {
        incident_id: incident.incident_id,
        incident_code: incident.incident_code,
        status: incident.status,
        assignments,
        incident
      });
    } catch (err) {
      console.error('Socket emitIncidentVerified failed:', err.message);
    }
  },

  /**
   * Broadcast that an incident has been rejected as a false alarm.
   * Emitted when admin rejects an incident.
   */
  emitIncidentRejected: (incident) => {
    try {
      const io = getIO();
      io.to('admin').emit('incident_rejected', {
        incident_id: incident.incident_id,
        incident_code: incident.incident_code,
        status: incident.status
      });
    } catch (err) {
      console.error('Socket emitIncidentRejected failed:', err.message);
    }
  },

  /**
   * Notify reporter that admin is requesting more information.
   * Emitted when admin requests more info about an incident.
   */
  emitMoreInfoRequested: (incident, message) => {
    try {
      const io = getIO();
      io.to(`reporter-${incident.reported_by}`).emit('more_info_requested', {
        incident_id: incident.incident_id,
        incident_code: incident.incident_code,
        message: message || 'Admin is requesting more information about your incident'
      });
    } catch (err) {
      console.error('Socket emitMoreInfoRequested failed:', err.message);
    }
  },

  /**
   * Broadcast that an incident has been deleted.
   * Emitted when admin or system deletes an incident.
   */
  emitIncidentDeleted: (incidentId) => {
    try {
      const io = getIO();
      io.to('admin').emit('incident_deleted', { incident_id: incidentId });
      io.to('response').emit('incident_deleted', { incident_id: incidentId });
    } catch (err) {
      console.error('Socket emitIncidentDeleted failed:', err.message);
    }
  },

  /**
   * Broadcast that an incident type has been deleted.
   * Emitted when admin deletes an incident type.
   */
  emitIncidentTypeDeleted: (typeId) => {
    try {
      const io = getIO();
      io.to('admin').emit('incident_type_deleted', { type_id: typeId });
      io.to('response').emit('incident_type_deleted', { type_id: typeId });
    } catch (err) {
      console.error('Socket emitIncidentTypeDeleted failed:', err.message);
    }
  },

  /**
   * Broadcast that a user has been deleted.
   * Emitted when admin deletes a user account.
   */
  emitUserDeleted: (userId) => {
    try {
      const io = getIO();
      io.to('admin').emit('user_deleted', { user_id: userId });
    } catch (err) {
      console.error('Socket emitUserDeleted failed:', err.message);
    }
  },

  /**
   * Broadcast that a barangay has been deleted.
   * Emitted when admin deletes a barangay.
   */
  emitBarangayDeleted: (barangayId) => {
    try {
      const io = getIO();
      io.to('admin').emit('barangay_deleted', { barangay_id: barangayId });
    } catch (err) {
      console.error('Socket emitBarangayDeleted failed:', err.message);
    }
  },

  /**
   * Broadcast that a response unit has been deleted.
   * Emitted when admin deletes a response unit.
   */
  emitResponseUnitDeleted: (unitId) => {
    try {
      const io = getIO();
      io.to('admin').emit('response_unit_deleted', { unit_id: unitId });
      io.to('response').emit('response_unit_deleted', { unit_id: unitId });
    } catch (err) {
      console.error('Socket emitResponseUnitDeleted failed:', err.message);
    }
  },

  /**
   * Broadcast that an assignment has been deleted/cancelled.
   * Emitted when an assignment is removed.
   */
  emitAssignmentDeleted: (assignmentId, incidentId) => {
    try {
      const io = getIO();
      io.to('admin').emit('assignment_deleted', { assignment_id: assignmentId, incident_id: incidentId });
      io.to('response').emit('assignment_deleted', { assignment_id: assignmentId, incident_id: incidentId });
    } catch (err) {
      console.error('Socket emitAssignmentDeleted failed:', err.message);
    }
  },

  /**
   * Emit when incident priority changes
   * Emitted when admin updates incident priority
   */
  emitIncidentPriorityChanged: (incidentId, priority) => {
    try {
      const io = getIO();
      io.to('admin').emit('incident_priority_changed', {
        incident_id: incidentId,
        priority,
        timestamp: new Date()
      });
      io.to('response').emit('incident_priority_changed', {
        incident_id: incidentId,
        priority,
        timestamp: new Date()
      });
    } catch (err) {
      console.warn('Socket emit error (incident_priority_changed):', err.message);
    }
  },

  /**
   * Emit when incident is escalated with backup units
   * Emitted when admin escalates an incident
   */
  emitIncidentEscalated: (incidentId, newAssignments) => {
    try {
      const io = getIO();
      io.to('admin').emit('incident_escalated', {
        incident_id: incidentId,
        new_assignments: newAssignments.map(a => ({
          assignment_id: a.assignment_id,
          unit_id: a.unit_id,
          unit_name: a.unit?.unit_name,
          assigned_at: a.assigned_at
        })),
        total_units_now: newAssignments.length,
        timestamp: new Date()
      });
      io.to('response').emit('incident_escalated', {
        incident_id: incidentId,
        new_assignments: newAssignments.map(a => ({
          assignment_id: a.assignment_id,
          unit_id: a.unit_id,
          unit_name: a.unit?.unit_name,
          assigned_at: a.assigned_at
        })),
        total_units_now: newAssignments.length,
        timestamp: new Date()
      });
    } catch (err) {
      console.warn('Socket emit error (incident_escalated):', err.message);
    }
  },

  /**
   * Emit when response unit availability status changes
   * Emitted when unit.availability_status changes
   */
  emitUnitAvailabilityChanged: (unitId, status) => {
    try {
      const io = getIO();
      io.to('admin').emit('unit_availability_changed', {
        unit_id: unitId,
        availability_status: status,
        updated_at: new Date()
      });
      io.to('response').emit('unit_availability_changed', {
        unit_id: unitId,
        availability_status: status,
        updated_at: new Date()
      });
    } catch (err) {
      console.warn('Socket emit error (unit_availability_changed):', err.message);
    }
  },

  /**
   * Emit new assignment notification to specific unit
   * Alias for emitAssignment for clarity
   */
  emitNewAssignment: (unitId, data) => {
    try {
      const io = getIO();
      io.to(`unit-${unitId}`).emit('new_assignment', data);
      io.to('admin').emit('new_assignment', data);
      io.to('response').emit('new_assignment', data);
    } catch (err) {
      console.error('Socket emitNewAssignment failed:', err.message);
    }
  },
};