import express from 'express';
const router = express.Router();
import * as userController from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js'; // Assume authorize allows roles

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.patch('/:id/toggle', userController.toggleStatus);

export default router;
