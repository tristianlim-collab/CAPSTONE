import { prisma } from '../config/database.js';

/**
 * Submit a post-incident report
 * POST /api/post-reports
 */
export const submitReport = async (req, res) => {
  try {
    const { incident_id, response_time_minutes, actions_taken, casualties, damages_estimate, remarks } = req.body;

    if (!incident_id || !actions_taken) {
      return res.status(400).json({ message: 'incident_id and actions_taken are required' });
    }

    // Check if a report already exists for this incident
    const existing = await prisma.postIncidentReport.findUnique({
      where: { incident_id }
    });
    if (existing) {
      return res.status(409).json({ message: 'Post-incident report already submitted for this incident' });
    }

    const report = await prisma.postIncidentReport.create({
      data: {
        incident_id,
        submitted_by: req.user.id,
        response_time_minutes: response_time_minutes ? parseInt(response_time_minutes) : null,
        actions_taken,
        casualties: casualties ? parseInt(casualties) : 0,
        damages_estimate: damages_estimate || null,
        remarks: remarks || null
      },
      include: {
        incident: { include: { incident_type: true } },
        submitter: { select: { name: true, email: true } }
      }
    });

    // Also update the incident status to RESOLVED
    await prisma.incident.update({
      where: { incident_id },
      data: { status: 'RESOLVED' }
    });

    // Log the status change
    await prisma.incidentStatusLog.create({
      data: {
        incident_id,
        changed_by: req.user.id,
        status: 'RESOLVED',
        remarks: `Post-incident report submitted. Actions: ${actions_taken}`
      }
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('submitReport error:', error);
    res.status(500).json({ message: 'Error submitting post-incident report', error: error.message });
  }
};

/**
 * Get post-incident report by incident ID
 * GET /api/post-reports/:incidentId
 */
export const getByIncident = async (req, res) => {
  try {
    const report = await prisma.postIncidentReport.findUnique({
      where: { incident_id: req.params.incidentId },
      include: {
        incident: { include: { incident_type: true, barangay: true } },
        submitter: { select: { name: true, email: true, role: true } }
      }
    });
    if (!report) return res.status(404).json({ message: 'No post-incident report found' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching report', error: error.message });
  }
};
