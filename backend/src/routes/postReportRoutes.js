import express from 'express';
const router = express.Router();
import * as controller from '../controllers/postReportController.js';
import { authenticate, authorize } from '../middleware/auth.js';

router.use(authenticate);
router.post('/', authorize('RESPONSE_UNIT', 'ADMIN'), controller.submitReport);
router.get('/:incidentId', authorize('RESPONSE_UNIT', 'ADMIN'), controller.getByIncident);

export default router;
