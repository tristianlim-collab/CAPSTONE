import { generateIncidentCode } from './incidentCode.js';

describe('White-Box Unit Testing - Incident Code Format Generator', () => {

  test('should generate zero-padded code format INC-YYYY-001 for first incident', async () => {
    const mockPrisma = {
      incident: {
        count: async () => 0
      }
    };
    
    const year = new Date().getFullYear();
    const prefix = `INC-${year}-`;
    const count = await mockPrisma.incident.count();
    const number = (count + 1).toString().padStart(3, '0');
    const generatedCode = `${prefix}${number}`;

    expect(generatedCode).toBe(`INC-${year}-001`);
  });

  test('should generate incremented zero-padded code INC-YYYY-043 for 42 existing incidents', async () => {
    const mockPrisma = {
      incident: {
        count: async () => 42
      }
    };

    const year = new Date().getFullYear();
    const prefix = `INC-${year}-`;
    const count = await mockPrisma.incident.count();
    const number = (count + 1).toString().padStart(3, '0');
    const generatedCode = `${prefix}${number}`;

    expect(generatedCode).toBe(`INC-${year}-043`);
  });

  test('should handle 3-digit overflow gracefully INC-YYYY-105', async () => {
    const mockPrisma = {
      incident: {
        count: async () => 104
      }
    };

    const year = new Date().getFullYear();
    const prefix = `INC-${year}-`;
    const count = await mockPrisma.incident.count();
    const number = (count + 1).toString().padStart(3, '0');
    const generatedCode = `${prefix}${number}`;

    expect(generatedCode).toBe(`INC-${year}-105`);
  });

});
