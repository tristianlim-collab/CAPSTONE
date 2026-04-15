import { Server } from 'socket.io';
let io;
export default {
  init: (server) => {
    io = new Server(server, { cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST'] } });
    io.on('connection', (socket) => {
      socket.on('join_room', (room) => socket.join(room));
    });
    return io;
  },
  getIO: () => {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
  },
  emitNewIncident: (incident) => { if(io) io.to('ADMIN').to('RESPONSE_UNIT').emit('new_incident', incident); },
  emitIncidentStatusUpdate: (data) => { if(io) io.emit('incident_status_updated', data); },
  emitAssignment: (unitId, data) => { if(io) io.to(`UNIT_${unitId}`).emit('new_assignment', data); }
};