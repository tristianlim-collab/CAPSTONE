import { prisma } from '../config/database.js';
export const getAll = async (req, res) => {
  try {
    const types = await prisma.incidentType.findMany();
    res.json(types);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching', error: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const { name, color_code, icon_label, description } = req.body;
    const type = await prisma.incidentType.create({
      data: { name, color_code, icon_label, description }
    });
    res.status(201).json(type);
  } catch (error) {
    res.status(500).json({ message: 'Error creating', error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const { name, color_code, icon_label, description } = req.body;
    const type = await prisma.incidentType.update({
      where: { type_id: req.params.id },
      data: { name, color_code, icon_label, description }
    });
    res.json(type);
  } catch (error) {
    res.status(500).json({ message: 'Error updating', error: error.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    await prisma.incidentType.delete({ where: { type_id: req.params.id } });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting', error: error.message });
  }
};
