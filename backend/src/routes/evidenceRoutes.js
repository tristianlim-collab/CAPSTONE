import express from 'express';
const router = express.Router();
import * as controller from '../controllers/evidenceController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

router.post('/', optionalAuthenticate, controller.uploadMiddleware.single('file'), controller.uploadEvidence);
router.post('/from-url', optionalAuthenticate, controller.uploadEvidenceFromUrl);
router.get('/:incidentId', authenticate, controller.getByIncident);

export default router;
