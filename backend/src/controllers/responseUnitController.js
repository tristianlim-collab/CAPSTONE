import { prisma } from '../config/database.js';
import socketService from '../services/socketService.js';
export const getAll = async (req, res) => {
  try {
    const units = await prisma.responseUnit.findMany({
      include: { barangay: true }
    });
    res.json(units);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching', error: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const { unit_name, unit_type, contact_number, barangay_id, latitude, longitude } = req.body;
    const unit = await prisma.responseUnit.create({
      data: { unit_name, unit_type, contact_number, barangay_id, latitude, longitude }
    });
    res.status(201).json(unit);
  } catch (error) {
    res.status(500).json({ message: 'Error creating', error: error.message });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const unit = await prisma.responseUnit.update({
      where: { unit_id: req.params.id },
      data: { latitude, longitude, last_updated: new Date() }
    });
    // Broadcast location update to all connected clients
    socketService.emitUnitLocationUpdate(unit.unit_id, unit.latitude, unit.longitude, unit.unit_name);
    res.json(unit);
  } catch (error) {
    res.status(500).json({ message: 'Error updating location', error: error.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const unit = await prisma.responseUnit.update({
      where: { unit_id: req.params.id },
      data: { availability_status: status, last_updated: new Date() }
    });
    res.json(unit);
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
};

export const updateUnit = async (req, res) => {
  try {
    const { unit_name, unit_type, contact_number, barangay_id } = req.body;
    const unit = await prisma.responseUnit.update({
      where: { unit_id: req.params.id },
      data: { unit_name, unit_type, contact_number, barangay_id }
    });
    res.json(unit);
  } catch (error) {
    res.status(500).json({ message: 'Error updating unit', error: error.message });
  }
};

export const deleteUnit = async (req, res) => {
  try {
    await prisma.responseUnit.delete({ where: { unit_id: req.params.id } });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting unit', error: error.message });
  }
};

export const getActiveUnitPositions = async (req, res) => {
  try {
    const units = await prisma.responseUnit.findMany({
      where: {
        availability_status: {
          not: 'OFFLINE'
        }
      },
      select: {
        unit_id: true,
        unit_name: true,
        unit_type: true,
        latitude: true,
        longitude: true,
        availability_status: true
      }
    });
    res.json(units);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active units', error: error.message });
  }
};
