import express from 'express';
const router = express.Router();
import * as controller from '../controllers/incidentController.js';
import { authenticate, authorize } from '../middleware/auth.js'; // Mock assumption

router.use(authenticate);
router.post('/', controller.createIncident);
router.get('/', controller.getIncidents);
router.get('/heatmap', authorize('ADMIN'), controller.getHeatmap);
router.get('/:id', controller.getIncidentById);
router.patch('/:id/status', authorize('ADMIN', 'RESPONSE_UNIT'), controller.updateIncidentStatus);
router.post('/:id/backup', authorize('ADMIN', 'RESPONSE_UNIT'), controller.requestBackup);

export default router;
