import { prisma } from '../config/database.js';

/**
 * Generate unique incident code in format: INC-YYYY-XXX
 * Example: INC-2026-001
 */
export const generateIncidentCode = async () => {
  const year = new Date().getFullYear();
  const prefix = `INC-${year}-`;

  // Get the count of incidents created this year
  const count = await prisma.incident.count({
    where: {
      incident_code: {
        startsWith: prefix,
      },
    },
  });

  // Generate new code with zero-padded number
  const number = (count + 1).toString().padStart(3, '0');
  return `${prefix}${number}`;
};
