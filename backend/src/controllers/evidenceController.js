import { prisma } from '../config/database.js';
import multer from 'multer';
import path from 'path';

// Multer storage config (assuming saving locally for demo)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
export const uploadMiddleware = multer({ storage });

export const uploadEvidence = async (req, res) => {
  try {
    const { incident_id } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const evidence = await prisma.evidence.create({
      data: {
        incident_id,
        uploaded_by: req.user.id,
        file_path: `/uploads/${req.file.filename}`,
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
