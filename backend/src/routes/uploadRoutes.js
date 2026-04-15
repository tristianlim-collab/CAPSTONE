import express from 'express';
import { upload, uploadIncidentPhoto } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Routes
router.post(
  '/incident-photo',
  authenticate,
  upload.single('photo'),
  uploadIncidentPhoto
);

export default router;
