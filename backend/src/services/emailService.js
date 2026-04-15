import nodemailer from 'nodemailer';
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
    } catch (e) { return null; }
  }
}
export default new EmailService();