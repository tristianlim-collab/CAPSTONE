const fs = require('fs');
const path = require('path');

const phase2Files = {
  'backend/src/controllers/barangayController.js': `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const barangays = await prisma.barangay.findMany({ skip, take: limit });
    const total = await prisma.barangay.count();

    res.json({
      data: barangays,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching barangays', error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const barangay = await prisma.barangay.findUnique({
      where: { barangay_id: req.params.id },
      include: { response_units: true }
    });
    if (!barangay) return res.status(404).json({ message: 'Barangay not found' });
    res.json(barangay);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching barangay', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, municipality, city, boundary_geojson } = req.body;
    const barangay = await prisma.barangay.create({
      data: { name, municipality, city, boundary_geojson }
    });
    res.status(201).json(barangay);
  } catch (error) {
    res.status(500).json({ message: 'Error creating barangay', error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, municipality, city, boundary_geojson } = req.body;
    const barangay = await prisma.barangay.update({
      where: { barangay_id: req.params.id },
      data: { name, municipality, city, boundary_geojson }
    });
    res.json(barangay);
  } catch (error) {
    res.status(500).json({ message: 'Error updating barangay', error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await prisma.barangay.delete({ where: { barangay_id: req.params.id } });
    res.json({ message: 'Barangay deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting barangay', error: error.message });
  }
};
`,
  'backend/src/routes/barangayRoutes.js': `const express = require('express');
const router = express.Router();
const controller = require('../controllers/barangayController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', authorize('ADMIN'), controller.create);
router.put('/:id', authorize('ADMIN'), controller.update);
router.delete('/:id', authorize('ADMIN'), controller.delete);

module.exports = router;
`,
  'backend/src/controllers/evidenceController.js': `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');

// Multer storage config (assuming saving locally for demo)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/')),
  filename: (req, file, cb) => cb(null, \`\${Date.now()}-\${file.originalname}\`)
});
exports.uploadMiddleware = multer({ storage });

exports.uploadEvidence = async (req, res) => {
  try {
    const { incident_id } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const evidence = await prisma.evidence.create({
      data: {
        incident_id,
        uploaded_by: req.user.id,
        file_path: \`/uploads/\${req.file.filename}\`,
        file_type: req.file.mimetype
      }
    });
    res.status(201).json(evidence);
  } catch (error) {
    res.status(500).json({ message: 'Error uploading evidence', error: error.message });
  }
};

exports.getByIncident = async (req, res) => {
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
`,
  'backend/src/routes/evidenceRoutes.js': `const express = require('express');
const router = express.Router();
const controller = require('../controllers/evidenceController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/', controller.uploadMiddleware.single('file'), controller.uploadEvidence);
router.get('/:incidentId', controller.getByIncident);

module.exports = router;
`
};

for (const [filePath, content] of Object.entries(phase2Files)) {
  const fullPath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}
console.log('Phase 2 backend files generated');
