import { prisma } from '../config/database.js';
import socketService from '../services/socketService.js';

/**
 * Submit a post-incident report
 * POST /api/post-reports
 */
export const submitReport = async (req, res) => {
  const { incident_id, response_time_minutes, actions_taken, casualties, damages_estimate, remarks, photos } = req.body;

  if (!incident_id || !actions_taken) {
    return res.status(400).json({ message: 'incident_id and actions_taken are required' });
  }

  try {
    // Wrap in transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check for existing report
      const existing = await tx.postIncidentReport.findUnique({ where: { incident_id } });
      if (existing) throw new Error('ALREADY_SUBMITTED');

      // 2. Parse numbers safely
      const parsedCasualties = casualties ? parseInt(casualties) : 0;
      const parsedResponseTime = response_time_minutes ? parseInt(response_time_minutes) : null;

      // 3. Create the report
      const report = await tx.postIncidentReport.create({
        data: {
          incident_id,
          submitted_by: req.user.id,
          response_time_minutes: isNaN(parsedResponseTime) ? null : parsedResponseTime,
          actions_taken,
          casualties: isNaN(parsedCasualties) ? 0 : parsedCasualties,
          damages_estimate: damages_estimate || null,
          remarks: remarks || null,
          photos: Array.isArray(photos) ? photos.filter(p => typeof p === 'string' && p.length > 0) : [],
          status: 'APPROVED'
        },
        include: {
          incident: { include: { incident_type: true } },
          submitter: { select: { name: true, email: true } }
        }
      });

      // 4. Update incident status
      await tx.incident.update({
        where: { incident_id },
        data: { status: 'RESOLVED' }
      });

      // 5. Create status log
      await tx.incidentStatusLog.create({
        data: {
          incident_id,
          changed_by: req.user.id,
          status: 'RESOLVED',
          remarks: `Report submitted: ${actions_taken.substring(0, 100)}...`
        }
      });

      return report;
    });

    // Broadcast status update globally (for anonymous reporters)
    try {
      const fullIncident = await prisma.incident.findUnique({
        where: { incident_id },
        include: { incident_type: true, barangay: true, evidence: true }
      });
      socketService.emitIncidentStatusUpdate({
        incident_id,
        status: 'RESOLVED',
        incident: fullIncident,
        reported_by: fullIncident?.reported_by
      });
    } catch (sErr) {
      console.warn('Socket notification error:', sErr.message);
    }

    return res.status(201).json(result);
  } catch (error) {
    if (error.message === 'ALREADY_SUBMITTED') {
      return res.status(409).json({ message: 'Post-incident report already submitted for this incident' });
    }
    console.error('submitReport transaction error:', error);
    res.status(500).json({
      message: 'Error submitting post-incident report',
      error: error.message
    });
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
        incident: {
          include: {
            incident_type: true,
            barangay: true,
            evidence: true
          }
        },
        submitter: { select: { name: true, email: true, role: true } }
      }
    });
    if (!report) return res.status(404).json({ message: 'No post-incident report found' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching report', error: error.message });
  }
};

/**
 * Get all post-incident reports (Admin)
 * GET /api/post-reports
 */
export const getAllReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { status, type_id, from_date, to_date, search } = req.query;

    const where = {};
    if (status) where.status = status;
    if (type_id) {
      where.incident = {
        incident_type_id: type_id
      };
    }

    // Date range filter
    if (from_date || to_date) {
      where.submitted_at = {};
      if (from_date) where.submitted_at.gte = new Date(from_date);
      if (to_date) where.submitted_at.lte = new Date(to_date);
    }

    // Text search (incident code, description)
    if (search) {
      where.OR = [
        { incident: { incident_code: { contains: search, mode: 'insensitive' } } },
        { actions_taken: { contains: search, mode: 'insensitive' } }
      ];
    }

    const reports = await prisma.postIncidentReport.findMany({
      where,
      skip,
      take: limit,
      include: {
        incident: {
          include: {
            incident_type: true,
            barangay: true,
            reporter: { select: { name: true } },
            evidence: true
          }
        },
        submitter: { select: { name: true, email: true, role: true } }
      },
      orderBy: { submitted_at: 'desc' }
    });

    const total = await prisma.postIncidentReport.count({ where });

    res.json({
      data: reports,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reports', error: error.message });
  }
};

/**
 * Update post-incident report status and admin notes (Admin)
 * PATCH /api/post-reports/:id
 */
export const updateReportStatus = async (req, res) => {
  try {
    const { status, admin_notes } = req.body;

    if (!['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be PENDING, UNDER_REVIEW, APPROVED, or REJECTED' });
    }

    const report = await prisma.postIncidentReport.update({
      where: { report_id: req.params.id },
      data: {
        status,
        admin_notes: admin_notes || null,
        reviewed_by_id: status !== 'PENDING' ? req.user.id : null,
        reviewed_at: status !== 'PENDING' ? new Date() : null
      },
      include: {
        incident: { include: { incident_type: true, barangay: true } },
        submitter: { select: { name: true, email: true } }
      }
    });

    res.json(report);
  } catch (error) {
    console.error('updateReportStatus error:', error);
    res.status(500).json({ message: 'Error updating report', error: error.message });
  }
};
