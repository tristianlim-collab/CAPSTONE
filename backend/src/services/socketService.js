// Unified socket service — delegates to the single Socket.io instance in /socket.js
import { getIO, socketEvents } from '../../socket.js';

export default {
  getIO,

  /**
   * Broadcast a brand-new incident to every response-unit and admin dashboard.
   */
  emitNewIncident: (incident) => {
    try {
      const io = getIO();
      const completeIncident = { ...incident };
      
      // Always notify admins about every report
      io.to('admin').emit('new_incident', completeIncident);
      io.emit('new_incident', completeIncident);

      // Notify responders in the specific municipality, even if unverified (REPORTED)
      // This ensures local units are aware of incoming emergencies immediately.
      if (incident.barangay?.municipality) {
        const room = `municipality-${incident.barangay.municipality.toLowerCase()}`;
        io.to(room).emit('new_incident', completeIncident);
      }
    } catch (err) {
      console.error('Socket emitNewIncident failed:', err.message);
    }
  },

  /**
   * Broadcast an incident status update to relevant parties only.
   */
  emitIncidentStatusUpdate: (data) => {
    try {
      const io = getIO();
      const completeData = {
        ...data,
        incident: {
          ...data.incident,
          reporter_name: data.incident?.reporter_name,
          reporter_phone: data.incident?.reporter_phone
        }
      };

      // 1. Notify Admins and all connected response portals
      io.to('admin').emit('incident_status_updated', completeData);
      io.emit('incident_status_updated', completeData);

      // 2. Notify units in the specific municipality
      if (data.incident?.barangay?.municipality) {
        const room = `municipality-${data.incident.barangay.municipality.toLowerCase()}`;
        io.to(room).emit('incident_status_updated', completeData);
      }

      // 3. Notify explicitly assigned units (crucial for backups from other cities)
      if (data.incident?.assignments) {
        data.incident.assignments.forEach(asgn => {
          io.to(`unit-${asgn.unit_id}`).emit('incident_status_updated', completeData);
        });
      }
      
      // 4. Stay connected to the reporter
      if (completeData.reported_by) {
        io.to(`reporter-${completeData.reported_by}`).emit('incident_status_updated', completeData);
      } else {
        // For anonymous, we still need a way to reach them if they are on the success page
        // We use a global emit ONLY for the status updated event but reporters usually listen for their specific ID
        io.emit('incident_status_anonymous_update', completeData);
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
      
      // If the incident has a municipality, also notify other responders in that city
      if (data.incident?.barangay?.municipality) {
        const room = `municipality-${data.incident.barangay.municipality.toLowerCase()}`;
        io.to(room).emit('new_assignment', data);
      }
    } catch (err) {
      console.error('Socket emitAssignment failed:', err.message);
    }
  },

  /**
   * Broadcast a unit location update.
   */
  emitUnitLocationUpdate: (unitId, lat, lng, unitName) => {
    try {
      const io = getIO();
      const payload = { unitId, lat, lng, unitName, timestamp: new Date() };
      io.to('admin').emit('unit_location_updated', payload);
      io.to('response').emit('unit_location_updated', payload);
    } catch (err) {
      console.error('Socket emitUnitLocationUpdate failed:', err.message);
    }
  },

  /**
   * Broadcast that an incident is awaiting verification.
   */
  emitIncidentAwaitingVerification: (incident) => {
    try {
      const io = getIO();
      io.to('admin').emit('incident_awaiting_verification', {
        incident_id: incident.incident_id,
        incident_code: incident.incident_code,
        type: incident.incident_type?.name,
        severity: incident.severity,
        location: incident.map_pin_address,
        description: incident.description,
        reported_at: incident.reported_at,
        status: incident.status,
        latitude: incident.latitude,
        longitude: incident.longitude,
        incident
      });
    } catch (err) {
      console.error('Socket emitIncidentAwaitingVerification failed:', err.message);
    }
  },

  /**
   * Broadcast that an incident has been verified and dispatched globally.
   */
  emitIncidentVerified: (incident, assignments) => {
    try {
      const io = getIO();
      const payload = {
        incident_id: incident.incident_id,
        incident_code: incident.incident_code,
        status: incident.status,
        assignments,
        incident
      };
      // Broadcast globally for reporters
      io.emit('incident_verified', payload);
      
      // Notify responders in the specific municipality
      if (incident.barangay?.municipality) {
        const room = `municipality-${incident.barangay.municipality.toLowerCase()}`;
        io.to(room).emit('new_incident', incident);
      }
    } catch (err) {
      console.error('Socket emitIncidentVerified failed:', err.message);
    }
  },

  /**
   * Broadcast that an incident has been rejected globally.
   */
  emitIncidentRejected: (incident) => {
    try {
      const io = getIO();
      const payload = {
        incident_id: incident.incident_id,
        incident_code: incident.incident_code,
        status: incident.status
      };
      io.emit('incident_rejected', payload);
      io.emit('incident_status_updated', payload);
    } catch (err) {
      console.error('Socket emitIncidentRejected failed:', err.message);
    }
  },

  /**
   * Notify reporter about more info request.
   */
  emitMoreInfoRequested: (incident, message) => {
    try {
      const io = getIO();
      if (incident.reported_by) {
        io.to(`reporter-${incident.reported_by}`).emit('more_info_requested', {
          incident_id: incident.incident_id,
          incident_code: incident.incident_code,
          message: message || 'Admin is requesting more information about your incident'
        });
      }
    } catch (err) {
      console.error('Socket emitMoreInfoRequested failed:', err.message);
    }
  },

  /**
   * Broadcast incident deletion globally.
   */
  emitIncidentDeleted: (incidentId) => {
    try {
      const io = getIO();
      io.emit('incident_deleted', { incident_id: incidentId });
    } catch (err) {
      console.error('Socket_emitIncidentDeleted failed:', err.message);
    }
  },

  /**
   * Broadcast that an incident type has been deleted.
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
   * Emit when incident priority changes.
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
   * Emit when incident is escalated.
   */
  emitIncidentEscalated: (incidentId, newAssignments) => {
    try {
      const io = getIO();
      const payload = {
        incident_id: incidentId,
        new_assignments: newAssignments.map(a => ({
          assignment_id: a.assignment_id,
          unit_id: a.unit_id,
          unit_name: a.unit?.unit_name,
          assigned_at: a.assigned_at
        })),
        total_units_now: newAssignments.length,
        timestamp: new Date()
      };
      io.to('admin').emit('incident_escalated', payload);
      io.to('response').emit('incident_escalated', payload);
    } catch (err) {
      console.warn('Socket emit error (incident_escalated):', err.message);
    }
  },

  /**
   * Emit when response unit availability status changes.
   */
  emitUnitAvailabilityChanged: (unitId, status) => {
    try {
      const io = getIO();
      const payload = {
        unit_id: unitId,
        availability_status: status,
        updated_at: new Date()
      };
      io.to('admin').emit('unit_availability_changed', payload);
      io.to('response').emit('unit_availability_changed', payload);
    } catch (err) {
      console.warn('Socket emit error (unit_availability_changed):', err.message);
    }
  },

  /**
   * Alias for emitAssignment.
   */
  emitNewAssignment: (unitId, data) => {
    try {
      const io = getIO();
      io.to(`unit-${unitId}`).emit('new_assignment', data);
      io.to('admin').emit('new_assignment', data);
      
      if (data.incident?.barangay?.municipality) {
        const room = `municipality-${data.incident.barangay.municipality.toLowerCase()}`;
        io.to(room).emit('new_assignment', data);
      }
    } catch (err) {
      console.error('Socket emitNewAssignment failed:', err.message);
    }
  },

  /**
   * Emit dispatch directions.
   */
  emitDispatchWithDirections: (unitId, payload) => {
    try {
      const io = getIO();
      io.to(`unit-${unitId}`).emit('unit_dispatch_with_directions', payload);
      io.to('response').emit('unit_dispatch_with_directions', payload);
      io.to('admin').emit('unit_dispatch_with_directions', payload);
    } catch (err) {
      console.error('Socket emitDispatchWithDirections failed:', err.message);
    }
  },
};