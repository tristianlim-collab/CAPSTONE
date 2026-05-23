import { prisma } from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);



export const register = async (req, res) => {
  try {
    const { name, email, password, role, contact_number, fcm_token } = req.body;
    
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
        contact_number,
        fcm_token: fcm_token || null,
      }
    });

    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
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
    let { email, password, fcm_token } = req.body;
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
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Update FCM token if provided
    if (fcm_token) {
      await prisma.user.update({
        where: { user_id: user.user_id },
        data: { fcm_token },
      }).catch(err => console.error('FCM token update error:', err.message));
    }

    res.json({
      token,
      user: { id: user.user_id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { credential, role } = req.body;
    
    // Verify the Google JWT token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const email = payload.email.toLowerCase();
    const name = payload.name;
    
    const requestedRole = (role && ['REPORTER', 'RESPONSE_UNIT', 'ADMIN'].includes(role)) ? role : 'REPORTER';

    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      // Create user if they don't exist
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 12);
      
      user = await prisma.user.create({
        data: {
          name,
          email,
          password_hash: hashedPassword,
          role: requestedRole,
        }
      });
    } else if (user.role !== requestedRole) {
      // For development/testing: Update the user's role if they selected a different one
      user = await prisma.user.update({
        where: { email },
        data: { role: requestedRole }
      });
    }
    
    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      token,
      user: { id: user.user_id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    res.status(401).json({ message: 'Invalid Google credential' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.user.id || req.user.id },
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
    const userId = req.user.id || req.user.id;

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
    const userId = req.user.id;

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

/**
 * Update or refresh the user's FCM push notification token.
 * Called when the mobile/web app gets a new FCM token.
 */
export const updateFcmToken = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id || req.user.id;
    const { fcm_token } = req.body;

    if (!fcm_token) {
      return res.status(400).json({ message: 'fcm_token is required' });
    }

    await prisma.user.update({
      where: { user_id: userId },
      data: { fcm_token },
    });

    res.json({ message: 'FCM token updated successfully' });
  } catch (error) {
    console.error('FCM token update error:', error);
    res.status(500).json({ message: 'Error updating FCM token', error: error.message });
  }
};
