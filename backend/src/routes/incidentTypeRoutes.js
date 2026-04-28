import express from 'express';
const router = express.Router();
import * as controller from '../controllers/incidentTypeController.js';
import { authenticate, authorize } from '../middleware/auth.js';

// GET is public - incident types are reference data needed by all forms
router.get('/', controller.getAll);

// CUD operations require admin auth
router.post('/', authenticate, authorize('ADMIN'), controller.create);
router.put('/:id', authenticate, authorize('ADMIN'), controller.update);
router.delete('/:id', authenticate, authorize('ADMIN'), controller.deleteItem);

export default router;
