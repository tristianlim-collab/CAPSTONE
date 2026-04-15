import express from 'express';
const router = express.Router();
import * as controller from '../controllers/incidentTypeController.js';
import { authenticate, authorize } from '../middleware/auth.js';

router.use(authenticate);
router.get('/', controller.getAll);
router.post('/', authorize('ADMIN'), controller.create);
router.put('/:id', authorize('ADMIN'), controller.update);
router.delete('/:id', authorize('ADMIN'), controller.deleteItem);

export default router;
