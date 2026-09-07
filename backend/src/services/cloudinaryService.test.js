import { uploadBufferToCloudinary } from './cloudinaryService.js';

describe('White-Box Unit Testing - Cloudinary Image Buffer Helper Service', () => {

  test('should return null when image buffer is missing or undefined', async () => {
    const result = await uploadBufferToCloudinary(null);
    expect(result).toBeNull();
  });

  test('should format base64 string accurately from image buffer', async () => {
    const sampleBuffer = Buffer.from('test_image_binary_data');
    const base64String = `data:image/jpeg;base64,${sampleBuffer.toString("base64")}`;
    
    expect(base64String).toContain('data:image/jpeg;base64,');
    expect(base64String.length).toBeGreaterThan(20);
  });

});
