const fs = require('fs');
const path = require('path');

const services = {
  'backend/src/services/smsService.js': `const twilio = require('twilio');

class SMSService {
  constructor() {
    this.client = null;
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
    } else {
      console.warn('Twilio credentials missing - SMS service is running in mock mode');
    }
  }

  async sendSMS(to, body) {
    if (!to) return;
    
    try {
      if (this.client) {
        const message = await this.client.messages.create({
          body,
          from: process.env.TWILIO_PHONE_NUMBER,
          to
        });
        console.log(\`SMS sent successfully to \${to}, SID: \${message.sid}\`);
        return message.sid;
      } else {
        console.log(\`[MOCK SMS] To: \${to} | Message: \${body}\`);
        return 'mock-sid-' + Date.now();
      }
    } catch (error) {
      console.error('Failed to send SMS:', error.message);
      // Don't throw to prevent blocking the main flow
      return null;
    }
  }
}

module.exports = new SMSService();
`,

  'backend/src/services/emailService.js': `const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: process.env.SMTP_PORT || 2525,
      auth: {
        user: process.env.SMTP_USER || 'mock_user',
        pass: process.env.SMTP_PASS || 'mock_pass'
      }
    });
  }

  async sendEmail(to, subject, text, html = null) {
    if (!to) return;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"GAOIRS System" <noreply@gaoirs.com>',
      to,
      subject,
      text,
      html: html || text
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(\`Email sent successfully to \${to}, ID: \${info.messageId}\`);
      return info.messageId;
    } catch (error) {
      console.error('Failed to send Email:', error.message);
      return null;
    }
  }
}

module.exports = new EmailService();
`,

  'backend/src/services/socketService.js': `const socketIo = require('socket.io');

let io;

module.exports = {
  init: (server) => {
    io = socketIo(server, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST']
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Join rooms based on roles or specific entity IDs
      socket.on('join_room', (room) => {
        socket.join(room);
        console.log(\`Socket \${socket.id} joined room \${room}\`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    return io;
  },
  
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized');
    }
    return io;
  },

  // Helpers
  emitNewIncident: (incident) => {
    if(io) io.to('ADMIN').to('RESPONSE_UNIT').emit('new_incident', incident);
  },
  
  emitIncidentStatusUpdate: (data) => {
    if(io) io.emit('incident_status_updated', data); // Broadcast or target room
  },

  emitAssignment: (unitId, assignmentData) => {
    if(io) io.to(\`UNIT_\${unitId}\`).emit('new_assignment', assignmentData);
  }
};
`,

  'backend/src/services/alertService.js': `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const smsService = require('./smsService');
const emailService = require('./emailService');
const socketService = require('./socketService');

class AlertService {
  async notifyUnitDispatch(incident, unit, assignment, user) {
    const messageBody = \`DISPATCH ALERT [GAOIRS]: \${incident.incident_code}. Severity: \${incident.severity}. Location: \${incident.latitude}, \${incident.longitude}. Reply to acknowledge.\`;

    // 1. Send SMS
    if (unit.contact_number) {
      await smsService.sendSMS(unit.contact_number, messageBody);
    }

    // 2. Send Email (if unit has users attached, we could fetch them, or if unit has email)
    // Mocking email logic to admin/supervisor for now
    if (user && user.email) {
      await emailService.sendEmail(
        user.email,
        \`Dispatch: \${incident.incident_code}\`,
        messageBody
      );
    }

    // 3. Socket.io Emit
    socketService.emitAssignment(unit.unit_id, {
      incident,
      assignment
    });
    
    socketService.getIO().to('ADMIN').emit('system_alert', {
      message: \`Unit \${unit.unit_name} dispatched to \${incident.incident_code}\`
    });
  }

  async notifyStatusChange(incident, newStatus) {
    const message = \`Incident \${incident.incident_code} status updated to \${newStatus}\`;
    
    // Broadcast via socket
    socketService.emitIncidentStatusUpdate({
      incident_id: incident.incident_id,
      status: newStatus
    });

    // We can also notify the reporter via SMS/Email if they have contact info
    if (incident.reporter) {
       if (incident.reporter.contact_number) {
         await smsService.sendSMS(incident.reporter.contact_number, message);
       }
       if (incident.reporter.email) {
         await emailService.sendEmail(
           incident.reporter.email,
           \`Incident Update: \${incident.incident_code}\`,
           message
         );
       }
    }
  }
}

module.exports = new AlertService();
`
};

for (const [filePath, content] of Object.entries(services)) {
  const fullPath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}
console.log('Services generated.');
