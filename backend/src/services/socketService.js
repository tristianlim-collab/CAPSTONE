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
};