import { prisma } from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';



export const register = async (req, res) => {
  try {
    const { name, email, password, role, contact_number } = req.body;
    
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
    const { email, password } = req.body;
    
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
      where: { user_id: req.user.id },
      select: { user_id: true, name: true, email: true, role: true, contact_number: true }
    });
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Convert user_id back to id for the frontend if needed, or just send entire user object
    res.json({ id: user.user_id, ...user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};
