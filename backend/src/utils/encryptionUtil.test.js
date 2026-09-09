import { encrypt, decrypt } from './encryptionUtil.js';

describe('White-Box Unit Testing - Module 8: Sensitive Data Encryption Utility', () => {

  test('TC-W029: encrypt_payload - should successfully encrypt plain text sensitive data', async () => {
    await new Promise(r => setTimeout(r, 600));
    const plainText = 'Citizen Confidential Contact 09171234567';
    const encryptedText = encrypt(plainText);

    expect(encryptedText).toBeDefined();
    expect(encryptedText).not.toBe(plainText);
    expect(encryptedText.includes(':')).toBe(true);
  });

  test('TC-W030: decrypt_payload - should successfully decrypt encrypted text back to original string', async () => {
    await new Promise(r => setTimeout(r, 600));
    const originalText = 'Emergency Responder Location Payload';
    const encryptedText = encrypt(originalText);
    const decryptedText = decrypt(encryptedText);

    expect(decryptedText).toBe(originalText);
  });

  test('TC-W031: invalid_format_fallback - should return null when trying to decrypt invalid format text', async () => {
    await new Promise(r => setTimeout(r, 600));
    const invalidEncryptedData = 'invalid_format_string';
    const result = decrypt(invalidEncryptedData);

    expect(result).toBeNull();
  });

});
