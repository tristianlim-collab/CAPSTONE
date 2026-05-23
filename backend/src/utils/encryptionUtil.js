import crypto from 'crypto';

// Use JWT_SECRET or a dedicated ENCRYPTION_KEY from env
const algorithm = 'aes-256-cbc';
const secretKey = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback_secret_key_32_chars_long!!'; 

// Ensure key is exactly 32 bytes for aes-256-cbc
const key = crypto.createHash('sha256').update(String(secretKey)).digest('base64').substring(0, 32);

export const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decrypt = (text) => {
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error('Decryption error:', err.message);
    return null;
  }
};
