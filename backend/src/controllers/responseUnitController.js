import { prisma } from '../config/database.js';
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
    // Socket.io emit could be here
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
