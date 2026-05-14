import express from 'express';
const router = express.Router();
import * as controller from '../controllers/postReportController.js';
import { authenticate, authorize } from '../middleware/auth.js';

router.use(authenticate);

// Response unit submits a report
router.post('/', authorize('RESPONSE_UNIT', 'ADMIN'), controller.submitReport);

// Response unit gets their report for an incident
router.get('/:incidentId', authorize('RESPONSE_UNIT', 'ADMIN'), controller.getByIncident);

// Admin endpoints
router.get('/', authorize('ADMIN'), controller.getAllReports);
router.patch('/:id', authorize('ADMIN'), controller.updateReportStatus);

export default router;
