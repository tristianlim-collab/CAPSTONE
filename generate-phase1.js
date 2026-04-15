const fs = require('fs');
const path = require('path');

const backendFiles = {
  // --------- SERVICES ---------
  'backend/src/services/geoService.js': `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const geoService = {
  /**
   * Find the barangay ID given a latitude/longitude point
   * Assumes boundary_geojson is stored as GeoJSON text in Prisma
   * Uses ST_Within via PostGIS
   */
  async findBarangayByPoint(lat, lng) {
    try {
      const result = await prisma.$queryRaw\`
        SELECT barangay_id 
        FROM "Barangay"
        WHERE ST_Within(
          ST_SetSRID(ST_MakePoint(\${lng}::float, \${lat}::float), 4326),
          ST_GeomFromGeoJSON(boundary_geojson::text)
        )
        LIMIT 1;
      \`;
      return result.length > 0 ? result[0].barangay_id : null;
    } catch (error) {
      console.error('GeoService findBarangayByPoint Error:', error);
      return null;
    }
  },

  /**
   * Find the nearest available response units to a given coordinate
   * Uses ST_Distance to compute meters between geographies
   */
  async findNearestUnits(lat, lng, limit = 5, unitType = null) {
    try {
      const typeFilter = unitType 
        ? prisma.sql\`AND unit_type = \${unitType}\` 
        : prisma.sql\`\`;

      const units = await prisma.$queryRaw\`
        SELECT unit_id, unit_name, unit_type, contact_number, availability_status, latitude, longitude,
               ST_Distance(
                 ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
                 ST_SetSRID(ST_MakePoint(\${lng}::float, \${lat}::float), 4326)::geography
               ) as distance
        FROM "ResponseUnit"
        WHERE availability_status = 'AVAILABLE' 
          AND latitude IS NOT NULL 
          AND longitude IS NOT NULL
        \${typeFilter}
        ORDER BY distance ASC
        LIMIT \${limit};
      \`;
      return units;
    } catch (error) {
      console.error('GeoService findNearestUnits Error:', error);
      return [];
    }
  },

  /**
   * Generate heatmap aggregation grouping incidents by grid / radius
   * Simplistic bounding box or distance query for frontend heatmap
   */
  async getHeatmapData(status = null) {
    try {
      // Return raw coordinates for heatmap rendering on the client map
      const where = status ? { status } : {};
      const incidents = await prisma.incident.findMany({
        where,
        select: {
          latitude: true,
          longitude: true,
          severity: true
        }
      });
      return incidents;
    } catch (error) {
      console.error('GeoService getHeatmapData Error:', error);
      return [];
    }
  }
};

module.exports = geoService;
`,

  // --------- CONTROLLERS ---------
  'backend/src/controllers/incidentController.js': `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const geoService = require('../services/geoService');

exports.createIncident = async (req, res) => {
  try {
    const { incident_type_id, description, latitude, longitude, map_pin_address, severity } = req.body;
    
    // Auto-detect barangay via PostGIS
    const detectedBarangayId = await geoService.findBarangayByPoint(latitude, longitude);
    
    // Generate unique code (e.g. INC-Date-Rand)
    const incident_code = \`INC-\${Date.now()}-\${Math.floor(Math.random()*1000)}\`;

    const incident = await prisma.incident.create({
      data: {
        incident_code,
        reported_by: req.user.id,
        incident_type_id,
        description,
        latitude,
        longitude,
        map_pin_address,
        severity: severity || 'MEDIUM',
        barangay_id: detectedBarangayId
      }
    });

    // Optionally: Automatically assign nearest units or emit socket event
    res.status(201).json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Error creating incident', error: error.message });
  }
};

exports.getIncidents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, severity, barangay_id, type_id } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (barangay_id) where.barangay_id = barangay_id;
    if (type_id) where.incident_type_id = type_id;

    if (req.user.role === 'REPORTER') {
      where.reported_by = req.user.id;
    }

    const incidents = await prisma.incident.findMany({
      where, skip, take: limit,
      include: {
        incident_type: true,
        barangay: true,
        reporter: { select: { name: true, email: true, contact_number: true } }
      },
      orderBy: { reported_at: 'desc' }
    });

    const total = await prisma.incident.count({ where });

    res.json({
      data: incidents,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching incidents', error: error.message });
  }
};

exports.getIncidentById = async (req, res) => {
  try {
    const incident = await prisma.incident.findUnique({
      where: { incident_id: req.params.id },
      include: {
        incident_type: true,
        barangay: true,
        reporter: { select: { name: true, contact_number: true } },
        assignments: {
          include: { unit: true }
        },
        status_logs: {
          orderBy: { changed_at: 'desc' }
        },
        evidence: true
      }
    });
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching incident', error: error.message });
  }
};

exports.updateIncidentStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    
    const incident = await prisma.incident.update({
      where: { incident_id: req.params.id },
      data: { status }
    });

    await prisma.incidentStatusLog.create({
      data: {
        incident_id: incident.incident_id,
        changed_by: req.user.id,
        status,
        remarks
      }
    });

    // TODO: Emit socket event for status update
    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Error updating incident status', error: error.message });
  }
};

exports.getHeatmap = async (req, res) => {
  try {
    const data = await geoService.getHeatmapData(req.query.status);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching heatmap', error: error.message });
  }
};
`,
  'backend/src/controllers/incidentTypeController.js': `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    const types = await prisma.incidentType.findMany();
    res.json(types);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, color_code, icon_label, description } = req.body;
    const type = await prisma.incidentType.create({
      data: { name, color_code, icon_label, description }
    });
    res.status(201).json(type);
  } catch (error) {
    res.status(500).json({ message: 'Error creating', error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, color_code, icon_label, description } = req.body;
    const type = await prisma.incidentType.update({
      where: { type_id: req.params.id },
      data: { name, color_code, icon_label, description }
    });
    res.json(type);
  } catch (error) {
    res.status(500).json({ message: 'Error updating', error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await prisma.incidentType.delete({ where: { type_id: req.params.id } });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting', error: error.message });
  }
};
`,
  'backend/src/controllers/assignmentController.js': `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const geoService = require('../services/geoService');

exports.assignUnitToIncident = async (req, res) => {
  try {
    const { incident_id, unit_id } = req.body;
    
    // Prevent double assigning
    const existing = await prisma.incidentAssignment.findFirst({
      where: { incident_id, unit_id, status: { notIn: ['RESOLVED'] } }
    });
    
    if (existing) return res.status(400).json({ message: 'Unit already assigned' });

    const assignment = await prisma.incidentAssignment.create({
      data: {
        incident_id,
        unit_id,
        assigned_by: req.user.id
      }
    });

    await prisma.responseUnit.update({
      where: { unit_id },
      data: { availability_status: 'BUSY' }
    });

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Error assigning unit', error: error.message });
  }
};

exports.getNearestUnits = async (req, res) => {
  try {
    const { incident_id, limit, unit_type } = req.query;
    const incident = await prisma.incident.findUnique({ where: { incident_id }});
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    
    const nearest = await geoService.findNearestUnits(
      incident.latitude, 
      incident.longitude, 
      parseInt(limit) || 5, 
      unit_type
    );
    
    res.json(nearest);
  } catch (error) {
    res.status(500).json({ message: 'Error finding nearest units', error: error.message });
  }
};

exports.updateAssignmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updateData = { status };
    
    if (status === 'ACKNOWLEDGED') updateData.acknowledged_at = new Date();
    if (status === 'ARRIVED') updateData.arrived_at = new Date();
    if (status === 'RESOLVED') updateData.resolved_at = new Date();

    const assignment = await prisma.incidentAssignment.update({
      where: { assignment_id: req.params.id },
      data: updateData
    });

    if (status === 'RESOLVED') {
      await prisma.responseUnit.update({
        where: { unit_id: assignment.unit_id },
        data: { availability_status: 'AVAILABLE' }
      });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating assignment', error: error.message });
  }
};
`,
  'backend/src/controllers/responseUnitController.js': `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    const units = await prisma.responseUnit.findMany({
      include: { barangay: true }
    });
    res.json(units);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { unit_name, unit_type, contact_number, barangay_id, latitude, longitude } = req.body;
    const unit = await prisma.responseUnit.create({
      data: { unit_name, unit_type, contact_number, barangay_id, latitude, longitude }
    });
    res.status(201).json(unit);
  } catch (error) {
    res.status(500).json({ message: 'Error creating', error: error.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const unit = await prisma.responseUnit.update({
      where: { unit_id: req.params.id },
      data: { latitude, longitude, last_updated: new Date() }
    });
    // Socket.io emit could be here
    res.json(unit);
  } catch (error) {
    res.status(500).json({ message: 'Error updating location', error: error.message });
  }
};
`,

  // --------- ROUTES ---------
  'backend/src/routes/incidentRoutes.js': `const express = require('express');
const router = express.Router();
const controller = require('../controllers/incidentController');
const { protect, authorize } = require('../middleware/auth'); // Mock assumption

router.use(protect);
router.post('/', controller.createIncident);
router.get('/', controller.getIncidents);
router.get('/heatmap', authorize('ADMIN'), controller.getHeatmap);
router.get('/:id', controller.getIncidentById);
router.patch('/:id/status', authorize('ADMIN', 'RESPONSE_UNIT'), controller.updateIncidentStatus);

module.exports = router;
`,
  'backend/src/routes/incidentTypeRoutes.js': `const express = require('express');
const router = express.Router();
const controller = require('../controllers/incidentTypeController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', controller.getAll);
router.post('/', authorize('ADMIN'), controller.create);
router.put('/:id', authorize('ADMIN'), controller.update);
router.delete('/:id', authorize('ADMIN'), controller.delete);

module.exports = router;
`,
  'backend/src/routes/assignmentRoutes.js': `const express = require('express');
const router = express.Router();
const controller = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.post('/', authorize('ADMIN'), controller.assignUnitToIncident);
router.get('/nearest', authorize('ADMIN', 'RESPONSE_UNIT'), controller.getNearestUnits);
router.patch('/:id/status', authorize('ADMIN', 'RESPONSE_UNIT'), controller.updateAssignmentStatus);

module.exports = router;
`,
  'backend/src/routes/responseUnitRoutes.js': `const express = require('express');
const router = express.Router();
const controller = require('../controllers/responseUnitController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', authorize('ADMIN', 'RESPONSE_UNIT'), controller.getAll);
router.post('/', authorize('ADMIN'), controller.create);
router.patch('/:id/location', authorize('ADMIN', 'RESPONSE_UNIT'), controller.updateLocation);

module.exports = router;
`
};

for (const [filePath, content] of Object.entries(backendFiles)) {
  const fullPath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}
console.log('Backend core generated');
