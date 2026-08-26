import { describe, it } from 'node:test';
import assert from 'node:assert';
import { encrypt, decrypt } from './encryptionUtil.js';

describe('White-Box Unit Testing - Encryption Utility', () => {

  it('should successfully encrypt plain text sensitive data', () => {
    const plainText = 'Citizen Confidential Contact 09171234567';
    const encryptedText = encrypt(plainText);

    assert.notStrictEqual(encryptedText, undefined);
    assert.notStrictEqual(encryptedText, plainText);
    assert.strictEqual(encryptedText.includes(':'), true);
  });

  it('should successfully decrypt encrypted text back to original string', () => {
    const originalText = 'Emergency Responder Location Payload';
    const encryptedText = encrypt(originalText);
    const decryptedText = decrypt(encryptedText);

    assert.strictEqual(decryptedText, originalText);
  });

  it('should return null when trying to decrypt invalid format text', () => {
    const invalidEncryptedData = 'invalid_format_string';
    const result = decrypt(invalidEncryptedData);

    assert.strictEqual(result, null);
  });

});
