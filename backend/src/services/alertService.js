import { prisma } from '../config/database.js';
import smsService from './smsService.js';
import emailService from './emailService.js';
import socketService from './socketService.js';
import notificationService from './notificationService.js';

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

    // Push notification to the responder's device(s)
    // Look up all users assigned to this response unit and send push to each
    try {
      const unitUsers = await prisma.user.findMany({
        where: { unit_id: unit.unit_id, fcm_token: { not: null } },
        select: { user_id: true, fcm_token: true },
      });

      for (const responder of unitUsers) {
        const pushResult = await notificationService.notifyDispatch(incident, unit, responder.fcm_token);
        if (pushResult?.error === 'INVALID_TOKEN') {
          await prisma.user.update({ where: { user_id: responder.user_id }, data: { fcm_token: null } }).catch(() => {});
        }
      }

      // Log push notification to NOTIFICATIONS table
      if (unitUsers.length > 0) {
        await prisma.notification.create({
          data: {
            incident_id: incident.incident_id,
            unit_id: unit.unit_id,
            assigned_by: assignment?.assigned_by || null,
            channel: 'PUSH',
            message_body: messageBody,
            delivery_status: unitUsers.length > 0 ? 'SENT' : 'FAILED',
          },
        }).catch(err => console.error('Push notification log error:', err.message));
      }
    } catch (err) {
      console.error('Push notification error (non-fatal):', err.message);
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

    // Push notification to the reporter
    try {
      if (incident.reporter?.fcm_token) {
        const pushResult = await notificationService.notifyStatusChange(incident, newStatus, incident.reporter.fcm_token);
        if (pushResult?.error === 'INVALID_TOKEN') {
          await prisma.user.update({ where: { user_id: incident.reporter.user_id }, data: { fcm_token: null } }).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Push notification error (non-fatal):', err.message);
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