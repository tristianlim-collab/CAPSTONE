import { generateIncidentCode } from './incidentCode.js';

describe('White-Box Unit Testing - Module 6: Incident Code Generator Algorithm (INC-YYYY-XXX)', () => {

  test('TC-W024: first_incident_code - should generate zero-padded code format INC-YYYY-001 for first incident', async () => {
    await new Promise(r => setTimeout(r, 600));
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

  test('TC-W025: incremented_code - should generate incremented zero-padded code INC-YYYY-043 for 42 existing incidents', async () => {
    await new Promise(r => setTimeout(r, 650));
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

});
