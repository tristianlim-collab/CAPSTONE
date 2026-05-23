import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const twilio = require('twilio');
import { getConfigValue } from '../controllers/systemConfigController.js';

class SMSService {
  constructor() {
    this.client = null;
    this.phoneNumber = null;
    this.lastConfigUpdate = 0;
  }

  async getClient() {
    // Basic cache to avoid hitting DB on every SMS (cache for 5 minutes)
    if (this.client && Date.now() - this.lastConfigUpdate < 5 * 60 * 1000) {
      return { client: this.client, phoneNumber: this.phoneNumber };
    }

    const accountSid = await getConfigValue('TWILIO_SID') || process.env.TWILIO_ACCOUNT_SID;
    const authToken = await getConfigValue('TWILIO_TOKEN') || process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = await getConfigValue('TWILIO_PHONE') || process.env.TWILIO_PHONE_NUMBER;

    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
    } else {
      this.client = null;
    }
    
    this.lastConfigUpdate = Date.now();
    return { client: this.client, phoneNumber: this.phoneNumber };
  }

  async sendSMS(to, body) {
    if (!to) return null;
    try {
      const { client, phoneNumber } = await this.getClient();
      if (client && phoneNumber) {
        const message = await client.messages.create({ body, from: phoneNumber, to });
        return message.sid;
      }
      return 'mock-sid-' + Date.now();
    } catch (e) {
      console.error('Twilio send error:', e.message);
      return null;
    }
  }
}
export default new SMSService();