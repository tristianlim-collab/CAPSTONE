const fs = require('fs');
let content = fs.readFileSync('backend/src/services/smsService.js', 'utf8');
content = content.replace(/import twilio from 'twilio';/g, "import { createRequire } from 'module';\nconst require = createRequire(import.meta.url);\nconst twilio = require('twilio');");
fs.writeFileSync('backend/src/services/smsService.js', content);
