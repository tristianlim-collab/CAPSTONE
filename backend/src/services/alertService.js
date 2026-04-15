import { prisma } from '../config/database.js';
import smsService from './smsService.js';
import emailService from './emailService.js';
import socketService from './socketService.js';

class AlertService {
  async notifyUnitDispatch(incident, unit, assignment, user) {
    const messageBody = `DISPATCH ALERT [GAOIRS]: ${incident.incident_code}. Severity: ${incident.severity}. Location: ${incident.latitude}, ${incident.longitude}. Reply to acknowledge.`;
    if (unit.contact_number) {
      await smsService.sendSMS(unit.contact_number, messageBody);
    }
    if (user && user.email) {
      await emailService.sendEmail(user.email, `Dispatch: ${incident.incident_code}`, messageBody);
    }
    socketService.emitAssignment(unit.unit_id, { incident, assignment });
    socketService.getIO().to('ADMIN').emit('system_alert', { message: `Unit ${unit.unit_name} dispatched to ${incident.incident_code}` });
  }

  async notifyStatusChange(incident, newStatus) {
    const message = `Incident ${incident.incident_code} status updated to ${newStatus}`;
    socketService.emitIncidentStatusUpdate({ incident_id: incident.incident_id, status: newStatus });
    if (incident.reporter) {
       if (incident.reporter.contact_number) await smsService.sendSMS(incident.reporter.contact_number, message);
       if (incident.reporter.email) await emailService.sendEmail(incident.reporter.email, `Incident Update: ${incident.incident_code}`, message);
    }
  }
}

export const triggerMultiChannelAlert = async ({ incident, unit, message, email }) => {
   console.log("Triggered multi channel alert", message);
   const alertService = new AlertService();
   if (unit) {
      await alertService.notifyUnitDispatch(incident, unit, null, { email });
   } else {
      socketService.getIO().to('ADMIN').emit('system_alert', { message });
   }
   return true;
};
export default new AlertService();