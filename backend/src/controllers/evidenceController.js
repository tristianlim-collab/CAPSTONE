import { prisma } from '../config/database.js';
import multer from 'multer';
import { uploadImage } from '../utils/supabaseClient.js';
import socketService from '../services/socketService.js';

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

    // Fetch the updated incident with evidence to broadcast
    const updatedIncident = await prisma.incident.findUnique({
      where: { incident_id },
      include: {
        incident_type: true,
        barangay: true,
        reporter: { select: { name: true, email: true, contact_number: true } },
        assignments: { include: { unit: true } },
        evidence: true
      }
    });

    if (updatedIncident) {
      socketService.emitIncidentStatusUpdate({
        incident_id: updatedIncident.incident_id,
        incident_code: updatedIncident.incident_code,
        status: updatedIncident.status,
        reported_by: updatedIncident.reported_by,
        incident: updatedIncident
      });
    }

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

/**
 * Create evidence record from URL (for pre-uploaded files)
 * POST /api/evidence/from-url
 * Body: { incident_id, file_path, file_type, file_name }
 */
export const uploadEvidenceFromUrl = async (req, res) => {
  try {
    const { incident_id, file_path, file_type, file_name } = req.body;

    if (!incident_id || !file_path || !file_type) {
      return res.status(400).json({
        message: 'Missing required fields: incident_id, file_path, file_type'
      });
    }

    const evidence = await prisma.evidence.create({
      data: {
        incident_id,
        uploaded_by: req.user.id,
        file_path,
        file_type
      }
    });

    // Fetch the updated incident with evidence to broadcast
    const updatedIncident = await prisma.incident.findUnique({
      where: { incident_id },
      include: {
        incident_type: true,
        barangay: true,
        reporter: { select: { name: true, email: true, contact_number: true } },
        assignments: { include: { unit: true } },
        evidence: true
      }
    });

    if (updatedIncident) {
      socketService.emitIncidentStatusUpdate({
        incident_id: updatedIncident.incident_id,
        incident_code: updatedIncident.incident_code,
        status: updatedIncident.status,
        reported_by: updatedIncident.reported_by,
        incident: updatedIncident
      });
    }

    res.status(201).json(evidence);
  } catch (error) {
    res.status(500).json({ message: 'Error creating evidence record', error: error.message });
  }
};
