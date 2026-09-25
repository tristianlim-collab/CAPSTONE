import { prisma } from '../config/database.js';

export const getDistricts = async (req, res) => {
  try {
    const districts = await prisma.district.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { barangays: true, users: true }
        }
      }
    });
    res.json(districts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching districts', error: error.message });
  }
};

export const createDistrict = async (req, res) => {
  try {
    const { name, province } = req.body;
    if (!name) return res.status(400).json({ message: 'District name is required' });

    const district = await prisma.district.create({
      data: { name, province }
    });
    res.status(201).json(district);
  } catch (error) {
    res.status(500).json({ message: 'Error creating district', error: error.message });
  }
};
