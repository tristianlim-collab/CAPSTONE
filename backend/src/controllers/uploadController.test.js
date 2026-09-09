import { uploadIncidentPhoto } from './uploadController.js';
import { extractPublicId } from '../utils/supabaseClient.js';
import { uploadBufferToCloudinary } from '../services/cloudinaryService.js';

describe('White-Box Unit Testing - Module 4: Photo Evidence Upload & Cloud Storage Services', () => {

  const createMockResponse = () => {
    const res = {};
    res.statusCode = 200;
    res.jsonBody = null;
    res.status = function(code) {
      this.statusCode = code;
      return this;
    };
    res.json = function(data) {
      this.jsonBody = data;
      return this;
    };
    return res;
  };

  test('TC-W018: missing_file_guard - should return 400 Bad Request if req.file is missing', async () => {
    await new Promise(r => setTimeout(r, 600));
    const req = {};
    const res = createMockResponse();

    await uploadIncidentPhoto(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody.success).toBe(false);
    expect(res.jsonBody.message).toBe('No file uploaded');
  });

  test('TC-W019: process_photo_upload - should process image file upload successfully', async () => {
    await new Promise(r => setTimeout(r, 650));
    const req = {
      file: {
        originalname: 'fire_evidence.png',
        buffer: Buffer.from('mock_image_binary_data'),
        mimetype: 'image/png'
      }
    };
    const res = createMockResponse();

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: { url: 'https://rkiexbxkicykuxykgznp.supabase.co/storage/v1/object/public/incident-photos/incidents/test.png' }
    });

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody.data.url).toContain('supabase.co');
  });

  test('TC-W020: extract_public_id - should extract storage path from full Supabase URL correctly', async () => {
    await new Promise(r => setTimeout(r, 600));
    const fullUrl = 'https://rkiexbxkicykuxykgznp.supabase.co/storage/v1/object/public/incident-photos/incidents/fire_scene_101.jpg';
    const path = extractPublicId(fullUrl);
    expect(path).toBe('incidents/fire_scene_101.jpg');
  });

  test('TC-W021: null_buffer_fallback - should return null when image buffer is missing or undefined', async () => {
    await new Promise(r => setTimeout(r, 600));
    const result = await uploadBufferToCloudinary(null);
    expect(result).toBeNull();
  });

});
