import { prisma } from '../config/database.js';
import socketService from '../services/socketService.js';

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
    const { name, color_code, icon_label, description, default_unit_type } = req.body;
    const type = await prisma.incidentType.create({
      data: { name, color_code, icon_label, description, default_unit_type }
    });
    res.status(201).json(type);
  } catch (error) {
    res.status(500).json({ message: 'Error creating', error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const { name, color_code, icon_label, description, default_unit_type } = req.body;
    const type = await prisma.incidentType.update({
      where: { type_id: req.params.id },
      data: { name, color_code, icon_label, description, default_unit_type }
    });
    res.json(type);
  } catch (error) {
    res.status(500).json({ message: 'Error updating', error: error.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const typeId = req.params.id;
    await prisma.incidentType.delete({ where: { type_id: typeId } });

    // Emit socket event for deletion
    socketService.emitIncidentTypeDeleted(typeId);

    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting', error: error.message });
  }
};
