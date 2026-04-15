import express from 'express';
const router = express.Router();
import * as controller from '../controllers/assignmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

router.use(authenticate);
router.post('/', authorize('ADMIN'), controller.assignUnitToIncident);
router.get('/nearest', authorize('ADMIN', 'RESPONSE_UNIT'), controller.getNearestUnits);
router.patch('/:id/status', authorize('ADMIN', 'RESPONSE_UNIT'), controller.updateAssignmentStatus);

export default router;
