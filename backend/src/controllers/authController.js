import { prisma } from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';



export const register = async (req, res) => {
  try {
    const { name, email, password, role, contact_number } = req.body;
    
    // Validate phone number format if provided
    if (contact_number) {
      const phoneRegex = /^(\+639|09)\d{9}$/;
      if (!phoneRegex.test(contact_number)) {
        return res.status(400).json({ message: 'Invalid contact number format. Use +639 or 09 followed by 9 digits.' });
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Force all newly registered accounts via the public form to be Reporters
    const userRole = 'REPORTER';

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: hashedPassword,
        role: userRole,
        contact_number
      }
    });

    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user.user_id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.trim().toLowerCase();
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.user_id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id || req.user.id },
      select: { user_id: true, name: true, email: true, role: true, contact_number: true, unit_id: true, unit: true }
    });
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Map ResponseUnit to 'unit' to match usual frontend property if available
    res.json({ id: user.user_id, ...user, unit: user.unit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, contact_number } = req.body;
    const userId = req.user.id || req.user.user_id;

    // Validate phone number format if provided
    if (contact_number) {
      const phoneRegex = /^(\+639|09)\d{9}$/;
      if (!phoneRegex.test(contact_number)) {
        return res.status(400).json({ message: 'Invalid contact number format. Use +639 or 09 followed by 9 digits.' });
      }
    }

    // Optional: add email uniqueness check excluding this user
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.user_id !== userId) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const user = await prisma.user.update({
      where: { user_id: userId },
      data: { name, email, contact_number },
      select: { user_id: true, name: true, email: true, role: true, contact_number: true, unit_id: true, unit: true }
    });

    res.json({ message: 'Profile updated successfully', user: { id: user.user_id, ...user, unit: user.unit } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id || req.user.user_id;

    const user = await prisma.user.findUnique({ where: { user_id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect current password' });

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { user_id: userId },
      data: { password_hash: hashedPassword }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating password', error: error.message });
  }
};
