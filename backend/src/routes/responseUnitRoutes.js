import express from 'express';
const router = express.Router();
import * as controller from '../controllers/responseUnitController.js';
import { authenticate, authorize } from '../middleware/auth.js';

router.use(authenticate);
router.get('/', authorize('ADMIN', 'RESPONSE_UNIT'), controller.getAll);
router.get('/positions/active', authorize('ADMIN', 'RESPONSE_UNIT'), controller.getActiveUnitPositions);
router.post('/', authorize('ADMIN'), controller.create);
router.patch('/:id/location', authorize('ADMIN', 'RESPONSE_UNIT'), controller.updateLocation);
router.patch('/:id/status', authorize('ADMIN', 'RESPONSE_UNIT'), controller.updateStatus);
router.put('/:id', authorize('ADMIN'), controller.updateUnit);
router.get('/:id/history', authenticate, controller.getUnitActivityHistory);
router.delete('/:id', authorize('ADMIN'), controller.deleteUnit);

export default router;
