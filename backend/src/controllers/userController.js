import { prisma } from '../config/database.js';
import socketService from '../services/socketService.js';
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({
      skip,
      take: limit,
      select: { user_id: true, name: true, email: true, role: true, contact_number: true }
    });
    
    const total = await prisma.user.count();

    res.json({
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.params.id },
      select: { user_id: true, name: true, email: true, role: true, contact_number: true }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, email, role, contact_number } = req.body;
    const user = await prisma.user.update({
      where: { user_id: req.params.id },
      data: { name, email, role, contact_number },
      select: { user_id: true, name: true, email: true, role: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await prisma.user.delete({ where: { user_id: userId } });

    // Emit socket event for deletion
    socketService.emitUserDeleted(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
};

export const toggleStatus = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { user_id: req.params.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const updatedUser = await prisma.user.update({
      where: { user_id: req.params.id },
      data: { is_active: !user.is_active },
      select: { user_id: true, is_active: true, name: true }
    });
    
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error toggling user status' });
  }
};
