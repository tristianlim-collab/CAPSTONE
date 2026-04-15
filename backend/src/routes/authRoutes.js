import express from 'express';
const router = express.Router();
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js'; // Assume auth middleware is implemented in auth.js

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.getMe);

export default router;
