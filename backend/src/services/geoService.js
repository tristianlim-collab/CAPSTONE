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
        WHERE availability_status = 'AVAILABLE' 
          AND latitude IS NOT NULL 
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
