import { prisma } from '../config/database.js';
import multer from 'multer';
import { uploadImage } from '../utils/supabaseClient.js';

// Multer storage config (memory)
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({ storage });

export const uploadEvidence = async (req, res) => {
  try {
    const { incident_id } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Prepare filename
    const ext = req.file.originalname.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${ext}`;

    // Upload to Supabase Storage
    const fileUrl = await uploadImage(req.file.buffer, fileName, req.file.mimetype);

    const evidence = await prisma.evidence.create({
      data: {
        incident_id,
        uploaded_by: req.user.id,
        file_path: fileUrl,
        file_type: req.file.mimetype
      }
    });
    res.status(201).json(evidence);
  } catch (error) {
    res.status(500).json({ message: 'Error uploading evidence', error: error.message });
  }
};

export const getByIncident = async (req, res) => {
  try {
    const evidence = await prisma.evidence.findMany({
      where: { incident_id: req.params.incidentId },
      include: { uploader: { select: { name: true, role: true } } }
    });
    res.json(evidence);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching evidence', error: error.message });
  }
};
