import express from 'express';
const router = express.Router();
import * as controller from '../controllers/incidentController.js';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.js'; 

// Public: Submission of emergency reports with optional auth to track reporter
router.post('/', optionalAuthenticate, controller.createIncident);

// Public: Read-only access for anonymous users (reporter app, public map)
router.get('/', optionalAuthenticate, controller.getIncidents);
router.get('/:id', optionalAuthenticate, controller.getIncidentById);

// Protected: All mutation/management routes require auth
router.get('/heatmap', authenticate, authorize('ADMIN'), controller.getHeatmap);
router.get('/analytics/hotspots', authenticate, authorize('ADMIN'), controller.getIncidentHotspots);
router.patch('/:id/status', authenticate, authorize('ADMIN', 'RESPONSE_UNIT'), controller.updateIncidentStatus);
router.post('/:id/backup', authenticate, authorize('ADMIN', 'RESPONSE_UNIT'), controller.requestBackup);
router.post('/:id/verify', authenticate, authorize('ADMIN'), controller.verifyIncident);
router.patch('/:id/edit', authenticate, authorize('ADMIN'), controller.editIncident);
router.patch('/:id/priority', authenticate, authorize('ADMIN'), controller.updateIncidentPriority);
router.post('/:id/escalate', authenticate, authorize('ADMIN', 'RESPONSE_UNIT'), controller.escalateIncident);

export default router;
