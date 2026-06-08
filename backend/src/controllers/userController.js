import { prisma } from '../config/database.js';
import socketService from '../services/socketService.js';
import bcrypt from 'bcryptjs';
import { logAuditEvent } from './auditController.js';

export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({
      skip,
      take: limit,
      select: { user_id: true, name: true, email: true, role: true, contact_number: true, is_active: true, unit_id: true, created_at: true }
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
      select: { user_id: true, name: true, email: true, role: true, contact_number: true, unit_id: true }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, email, role, contact_number, unit_id } = req.body;
    const user = await prisma.user.update({
      where: { user_id: req.params.id },
      data: { name, email, role, contact_number, unit_id },
      select: { user_id: true, name: true, email: true, role: true, unit_id: true }
    });
    res.json(user);

    // Log the update
    await logAuditEvent({
      user_id: req.user.id,
      action: 'UPDATED_USER',
      resource: 'USER',
      resource_id: user.user_id,
      details: `Updated info for user ${user.email} (${user.name})`,
      ip_address: req.ip
    });

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

    // Log the deletion
    await logAuditEvent({
      user_id: req.user.id,
      action: 'DELETED_USER',
      resource: 'USER',
      resource_id: userId,
      details: `Deleted user account with ID: ${userId}`,
      ip_address: req.ip
    });

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

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, contact_number, unit_id } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: hashedPassword,
        role: role || 'REPORTER',
        contact_number,
        unit_id
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user: { id: user.user_id, name: user.name, email: user.email, role: user.role }
    });

    // Log the creation
    await logAuditEvent({
      user_id: req.user.id,
      action: 'CREATED_USER',
      resource: 'USER',
      resource_id: user.user_id,
      details: `Created new user ${user.email} with role ${user.role}`,
      ip_address: req.ip
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating user' });
  }
};
