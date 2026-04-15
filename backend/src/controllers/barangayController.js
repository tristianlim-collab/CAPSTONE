import { prisma } from '../config/database.js';
export const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const barangays = await prisma.barangay.findMany({ skip, take: limit });
    const total = await prisma.barangay.count();

    res.json({
      data: barangays,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching barangays', error: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const barangay = await prisma.barangay.findUnique({
      where: { barangay_id: req.params.id },
      include: { response_units: true }
    });
    if (!barangay) return res.status(404).json({ message: 'Barangay not found' });
    res.json(barangay);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching barangay', error: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const { name, municipality, city, boundary_geojson } = req.body;
    const barangay = await prisma.barangay.create({
      data: { name, municipality, city, boundary_geojson }
    });
    res.status(201).json(barangay);
  } catch (error) {
    res.status(500).json({ message: 'Error creating barangay', error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const { name, municipality, city, boundary_geojson } = req.body;
    const barangay = await prisma.barangay.update({
      where: { barangay_id: req.params.id },
      data: { name, municipality, city, boundary_geojson }
    });
    res.json(barangay);
  } catch (error) {
    res.status(500).json({ message: 'Error updating barangay', error: error.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    await prisma.barangay.delete({ where: { barangay_id: req.params.id } });
    res.json({ message: 'Barangay deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting barangay', error: error.message });
  }
};
