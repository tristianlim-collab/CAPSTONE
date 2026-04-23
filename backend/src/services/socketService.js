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
      // Send to admin room
      io.to('admin').emit('new_incident', incident);
      // Send to the general response room (all response-unit users)
      io.to('response').emit('new_incident', incident);
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
        incident
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
};