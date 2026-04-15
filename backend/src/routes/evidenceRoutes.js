import express from 'express';
const router = express.Router();
import * as controller from '../controllers/evidenceController.js';
import { authenticate } from '../middleware/auth.js';

router.use(authenticate);
router.post('/', controller.uploadMiddleware.single('file'), controller.uploadEvidence);
router.get('/:incidentId', controller.getByIncident);

export default router;
