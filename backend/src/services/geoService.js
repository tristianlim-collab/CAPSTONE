import { prisma } from '../config/database.js';
const geoService = {
  /**
   * Find the barangay ID given a latitude/longitude point
   * Assumes boundary_geojson is stored as GeoJSON text in Prisma
   * Uses ST_Within via PostGIS
   */
  async findBarangayByPoint(lat, lng) {
    try {
      const result = await prisma.$queryRaw`
        SELECT barangay_id 
        FROM "BARANGAYS"
        WHERE ST_Within(
          ST_SetSRID(ST_MakePoint(${lng}::float, ${lat}::float), 4326),
          ST_GeomFromGeoJSON(boundary_geojson::text)
        )
        LIMIT 1;
      `;
      return result.length > 0 ? result[0].barangay_id : null;
    } catch (error) {
      console.error('GeoService findBarangayByPoint Error:', error);
      return null;
    }
  },

  /**
   * Find the nearest available response units to a given coordinate
   * Uses ST_Distance to compute meters between geographies
   */
  async findNearestUnits(lat, lng, limit = 5, unitType = null) {
    try {
      const typeFilter = unitType
        ? prisma.sql`AND unit_type = ${unitType}`
        : prisma.sql``;

      const units = await prisma.$queryRaw`
        SELECT unit_id, unit_name, unit_type, contact_number, availability_status, latitude, longitude,
               ST_Distance(
                 ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
                 ST_SetSRID(ST_MakePoint(${lng}::float, ${lat}::float), 4326)::geography
               ) as distance
        FROM "RESPONSE_UNIT"
        WHERE latitude IS NOT NULL
          AND longitude IS NOT NULL
        ${typeFilter}
        ORDER BY distance ASC
        LIMIT ${limit};
      `;
      return units;
    } catch (error) {
      console.error('GeoService findNearestUnits Error:', error);
      return [];
    }
  },

  /**
   * Smart assignment: Find response units based on incident type, availability, jurisdiction, and proximity
   * Priority logic:
   * 1. Match incident type with unit type (REQUIRED)
   * 2. Filter by AVAILABLE status (priority), then OFFLINE
   * 3. Prefer units in same barangay (jurisdiction), then nearby
   * 4. Sort by distance ascending
   *
   * @param {number} incidentLat - Incident latitude
   * @param {number} incidentLng - Incident longitude
   * @param {string} unitType - Required unit type (e.g., FIRE, POLICE, MEDICAL)
   * @param {string} incidentBarangayId - Incident's barangay ID (for jurisdiction matching)
   * @param {number} limit - Max units to return (default: 3)
   * @returns {Promise<Array>} Array of units with distance, sorted by priority
   */
  async findSmartResponseUnits(incidentLat, incidentLng, unitType, incidentBarangayId = null, limit = 3) {
    try {
      // Step 1: Find units matching incident type
      // Step 2: Prioritize AVAILABLE units (status)
      // Step 3: Prioritize same barangay (jurisdiction)
      // Step 4: Sort by distance (proximity)

      const units = await prisma.$queryRaw`
        SELECT
          unit_id,
          unit_name,
          unit_type,
          contact_number,
          availability_status,
          latitude,
          longitude,
          barangay_id,
          ST_Distance(
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${incidentLng}::float, ${incidentLat}::float), 4326)::geography
          ) as distance_meters,
          -- Priority: Same barangay = 0, Different = 1
          CASE WHEN barangay_id = ${incidentBarangayId} THEN 0 ELSE 1 END as jurisdiction_priority,
          -- Priority: AVAILABLE = 0, OFFLINE = 1, ON_BREAK = 2, BUSY = 3
          CASE
            WHEN availability_status = 'AVAILABLE' THEN 0
            WHEN availability_status = 'OFFLINE' THEN 1
            WHEN availability_status = 'ON_BREAK' THEN 2
            ELSE 3
          END as status_priority
        FROM "RESPONSE_UNIT"
        WHERE
          latitude IS NOT NULL
          AND longitude IS NOT NULL
          AND unit_type = ${unitType}
        ORDER BY
          status_priority ASC,        -- AVAILABLE units first
          jurisdiction_priority ASC,  -- Same barangay next
          distance_meters ASC         -- Closest units last
        LIMIT ${limit};
      `;

      return units;
    } catch (error) {
      console.error('GeoService findSmartResponseUnits Error:', error);
      return [];
    }
  },

  /**
   * Generate heatmap aggregation grouping incidents by grid / radius
   * Simplistic bounding box or distance query for frontend heatmap
   */
  async getHeatmapData(status = null) {
    try {
      // Return raw coordinates for heatmap rendering on the client map
      const where = status ? { status } : {};
      const incidents = await prisma.incident.findMany({
        where,
        select: {
          latitude: true,
          longitude: true,
          severity: true
        }
      });
      return incidents;
    } catch (error) {
      console.error('GeoService getHeatmapData Error:', error);
      return [];
    }
  }
};

export default geoService;
