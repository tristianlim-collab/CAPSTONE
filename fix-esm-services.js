import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const alertServiceContent = \`import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import smsService from './smsService.js';
import emailService from './emailService.js';
import socketService from './socketService.js';

class AlertService {
  async notifyUnitDispatch(incident, unit, assignment, user) {
    const messageBody = \\\`DISPATCH ALERT [GAOIRS]: \\\${incident.incident_code}. Severity: \\\${incident.severity}. Location: \\\${incident.latitude}, \\\${incident.longitude}. Reply to acknowledge.\\\`;
    if (unit.contact_number) {
      await smsService.sendSMS(unit.contact_number, messageBody);
    }
    if (user && user.email) {
      await emailService.sendEmail(user.email, \\\`Dispatch: \\\${incident.incident_code}\\\`, messageBody);
    }
    socketService.emitAssignment(unit.unit_id, { incident, assignment });
    socketService.getIO().to('ADMIN').emit('system_alert', { message: \\\`Unit \\\${unit.unit_name} dispatched to \\\${incident.incident_code}\\\` });
  }

  async notifyStatusChange(incident, newStatus) {
    const message = \\\`Incident \\\${incident.incident_code} status updated to \\\${newStatus}\\\`;
    socketService.emitIncidentStatusUpdate({ incident_id: incident.incident_id, status: newStatus });
    if (incident.reporter) {
       if (incident.reporter.contact_number) await smsService.sendSMS(incident.reporter.contact_number, message);
       if (incident.reporter.email) await emailService.sendEmail(incident.reporter.email, \\\`Incident Update: \\\${incident.incident_code}\\\`, message);
    }
  }
}

export const triggerMultiChannelAlert = async ({ incident, unit, message, email }) => {
   // Implementation for the legacy controller expecting this
   console.log("Triggered multi channel alert", message);
   const alertService = new AlertService();
   if (unit) {
      await alertService.notifyUnitDispatch(incident, unit, null, { email });
   } else {
      socketService.getIO().to('ADMIN').emit('system_alert', { message });
   }
   return true;
};

export default new AlertService();\`;

const smsServiceContent = \`import twilio from 'twilio';

class SMSService {
  constructor() {
    this.client = null;
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (accountSid && authToken) this.client = twilio(accountSid, authToken);
  }
  async sendSMS(to, body) {
    if (!to) return null;
    try {
      if (this.client) {
        const message = await this.client.messages.create({ body, from: process.env.TWILIO_PHONE_NUMBER, to });
        return message.sid;
      }
      return 'mock-sid-' + Date.now();
    } catch (e) {
      return null;
    }
  }
}
export default new SMSService();\`;

const emailServiceContent = \`import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: process.env.SMTP_PORT || 2525,
      auth: { user: process.env.SMTP_USER || 'mock_user', pass: process.env.SMTP_PASS || 'mock_pass' }
    });
  }
  async sendEmail(to, subject, text, html = null) {
    if (!to) return null;
    try {
      const info = await this.transporter.sendMail({ from: process.env.EMAIL_FROM || '"GAOIRS"', to, subject, text, html: html || text });
      return info.messageId;
    } catch (e) {
      return null;
    }
  }
}
export default new EmailService();\`;

const socketServiceContent = \`import { Server } from 'socket.io';
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
  emitAssignment: (unitId, data) => { if(io) io.to(\\\`UNIT_\\\${unitId}\\\`).emit('new_assignment', data); }
};\`;

fs.writeFileSync(path.join(__dirname, 'backend/src/services/alertService.js'), alertServiceContent);
fs.writeFileSync(path.join(__dirname, 'backend/src/services/smsService.js'), smsServiceContent);
fs.writeFileSync(path.join(__dirname, 'backend/src/services/emailService.js'), emailServiceContent);
fs.writeFileSync(path.join(__dirname, 'backend/src/services/socketService.js'), socketServiceContent);
console.log("Services converted to ESM");
