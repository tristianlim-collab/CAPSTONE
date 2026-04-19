import { prisma } from '../config/database.js';
import smsService from './smsService.js';
import emailService from './emailService.js';
import socketService from './socketService.js';

class AlertService {
  async notifyUnitDispatch(incident, unit, assignment, user) {
    const messageBody = `DISPATCH ALERT [GAOIRS]: ${incident.incident_code}. Severity: ${incident.severity}. Location: ${incident.latitude}, ${incident.longitude}. Reply to acknowledge.`;
    try {
      if (unit.contact_number) {
        await smsService.sendSMS(unit.contact_number, messageBody).catch(err => console.error('SMS error:', err.message));
      }
      if (user && user.email) {
        await emailService.sendEmail(user.email, `Dispatch: ${incident.incident_code}`, messageBody).catch(err => console.error('Email error:', err.message));
      }
    } catch (err) {
      console.error('Alert channel error (non-fatal):', err.message);
    }
    socketService.emitAssignment(unit.unit_id, { incident, assignment });
    try {
      socketService.getIO().to('admin').emit('system_alert', { message: `Unit ${unit.unit_name} dispatched to ${incident.incident_code}` });
    } catch (err) {
      console.error('Socket system_alert error:', err.message);
    }
  }

  async notifyStatusChange(incident, newStatus) {
    const message = `Incident ${incident.incident_code} status updated to ${newStatus}`;
    socketService.emitIncidentStatusUpdate({
      incident_id: incident.incident_id,
      incident_code: incident.incident_code,
      status: newStatus,
      reported_by: incident.reported_by,
      incident
    });
    try {
      if (incident.reporter) {
        if (incident.reporter.contact_number) await smsService.sendSMS(incident.reporter.contact_number, message).catch(err => console.error('SMS error:', err.message));
        if (incident.reporter.email) await emailService.sendEmail(incident.reporter.email, `Incident Update: ${incident.incident_code}`, message).catch(err => console.error('Email error:', err.message));
      }
    } catch (err) {
      console.error('Alert channel error (non-fatal):', err.message);
    }
  }
}

export const triggerMultiChannelAlert = async ({ incident, unit, message, email }) => {
   console.log("Triggered multi channel alert", message);
   const alertService = new AlertService();
   if (unit) {
      await alertService.notifyUnitDispatch(incident, unit, null, { email });
   } else {
      try {
        socketService.getIO().to('admin').emit('system_alert', { message });
      } catch (err) {
        console.error('Socket system_alert error:', err.message);
      }
   }
   return true;
};
export default new AlertService();