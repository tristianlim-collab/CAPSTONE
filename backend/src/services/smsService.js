import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const twilio = require('twilio');
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
    } catch (e) { return null; }
  }
}
export default new SMSService();