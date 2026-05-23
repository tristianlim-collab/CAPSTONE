import nodemailer from 'nodemailer';
import { getConfigValue } from '../controllers/systemConfigController.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.lastConfigUpdate = 0;
  }

  async getTransporter() {
    // Basic cache to avoid hitting DB on every single email (cache for 5 minutes)
    if (this.transporter && Date.now() - this.lastConfigUpdate < 5 * 60 * 1000) {
      return this.transporter;
    }

    const host = await getConfigValue('SMTP_HOST') || process.env.SMTP_HOST || 'smtp.mailtrap.io';
    const port = await getConfigValue('SMTP_PORT') || process.env.SMTP_PORT || 2525;
    const user = await getConfigValue('SMTP_USER') || process.env.SMTP_USER || 'mock_user';
    const pass = await getConfigValue('SMTP_PASS') || process.env.SMTP_PASS || 'mock_pass';

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      auth: { user, pass }
    });
    this.lastConfigUpdate = Date.now();
    return this.transporter;
  }

  async sendEmail(to, subject, text, html = null) {
    if (!to) return null;
    try {
      const transporter = await this.getTransporter();
      const from = await getConfigValue('SMTP_FROM') || process.env.EMAIL_FROM || '"GAOIRS"';
      const info = await transporter.sendMail({ from, to, subject, text, html: html || text });
      return info.messageId;
    } catch (e) {
      console.error('SMTP send error:', e.message);
      return null;
    }
  }
}
export default new EmailService();