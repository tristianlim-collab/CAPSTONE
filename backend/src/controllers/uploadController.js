import multer from 'multer';
import { uploadImage } from '../utils/supabaseClient.js';

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * Upload incident photo
 * POST /api/upload/incident-photo
 */
export const uploadIncidentPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Prepare filename
    const ext = req.file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${ext}`;

    // Upload to Supabase Storage
    const imageUrl = await uploadImage(req.file.buffer, fileName, req.file.mimetype);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: imageUrl,
      },
    });
  } catch (error) {
    console.error('Upload incident photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message,
    });
  }
};
