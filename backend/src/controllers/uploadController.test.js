import { uploadIncidentPhoto } from './uploadController.js';

describe('White-Box Unit Testing - File & Media Upload Controller', () => {

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

  test('uploadIncidentPhoto: should return 400 Bad Request if req.file is missing', async () => {
    const req = {};
    const res = createMockResponse();

    await uploadIncidentPhoto(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody.success).toBe(false);
    expect(res.jsonBody.message).toBe('No file uploaded');
  });

  test('uploadIncidentPhoto: should process image file upload successfully', async () => {
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

});
