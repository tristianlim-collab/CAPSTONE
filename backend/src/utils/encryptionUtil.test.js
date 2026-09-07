import { encrypt, decrypt } from './encryptionUtil.js';

describe('White-Box Unit Testing - Encryption Utility', () => {

  it('should successfully encrypt plain text sensitive data', () => {
    const plainText = 'Citizen Confidential Contact 09171234567';
    const encryptedText = encrypt(plainText);

    expect(encryptedText).toBeDefined();
    expect(encryptedText).not.toBe(plainText);
    expect(encryptedText.includes(':')).toBe(true);
  });

  it('should successfully decrypt encrypted text back to original string', () => {
    const originalText = 'Emergency Responder Location Payload';
    const encryptedText = encrypt(originalText);
    const decryptedText = decrypt(encryptedText);

    expect(decryptedText).toBe(originalText);
  });

  it('should return null when trying to decrypt invalid format text', () => {
    const invalidEncryptedData = 'invalid_format_string';
    const result = decrypt(invalidEncryptedData);

    expect(result).toBeNull();
  });

});
