import { prisma } from '../config/database.js';
import geoService from '../services/geoService.js';
import alertService from '../services/alertService.js';

export const assignUnitToIncident = async (req, res) => {
  try {
    const { incident_id, unit_id } = req.body;
    
    // Prevent double assigning
    const existing = await prisma.incidentAssignment.findFirst({
      where: { incident_id, unit_id, status: { notIn: ['RESOLVED'] } }
    });
    
    if (existing) return res.status(400).json({ message: 'Unit already assigned' });

    const assignment = await prisma.incidentAssignment.create({
      data: {
        incident_id,
        unit_id,
        assigned_by: req.user.id
      }
    });

    const unit = await prisma.responseUnit.update({
      where: { unit_id },
      data: { availability_status: 'BUSY' }
    });

    // Notify the unit via SMS/Email/Socket
    const incident = await prisma.incident.findUnique({
      where: { incident_id },
      include: { reporter: true }
    });

    if (incident) {
      await alertService.notifyUnitDispatch(incident, unit, assignment, req.user);
    }

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Error assigning unit', error: error.message });
  }
};

export const getNearestUnits = async (req, res) => {
  try {
    const { incident_id, limit, unit_type } = req.query;
    const incident = await prisma.incident.findUnique({ where: { incident_id }});
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    
    const nearest = await geoService.findNearestUnits(
      incident.latitude, 
      incident.longitude, 
      parseInt(limit) || 5, 
      unit_type
    );
    
    res.json(nearest);
  } catch (error) {
    res.status(500).json({ message: 'Error finding nearest units', error: error.message });
  }
};

export const updateAssignmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updateData = { status };
    
    if (status === 'ACKNOWLEDGED') updateData.acknowledged_at = new Date();
    if (status === 'ARRIVED') updateData.arrived_at = new Date();
    if (status === 'RESOLVED') updateData.resolved_at = new Date();

    const assignment = await prisma.incidentAssignment.update({
      where: { assignment_id: req.params.id },
      data: updateData
    });

    if (status === 'RESOLVED') {
      await prisma.responseUnit.update({
        where: { unit_id: assignment.unit_id },
        data: { availability_status: 'AVAILABLE' }
      });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating assignment', error: error.message });
  }
};
