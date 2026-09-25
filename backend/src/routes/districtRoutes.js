import express from 'express';
import { getDistricts, createDistrict } from '../controllers/districtController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getDistricts);
router.post('/', authenticate, createDistrict);

export default router;
