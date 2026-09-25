import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';

const geoService = {
  /**
   * Find the barangay ID given a latitude/longitude point
   * Assumes boundary_geojson is stored as GeoJSON text in Prisma
   * Uses ST_Within via PostGIS
   */
  async findBarangayByPoint(lat, lng, mapPinAddress = null) {
    try {
      // 1. Polygon ST_Within check (for barangays with full GeoJSON boundary definitions)
      const polygonMatch = await prisma.$queryRaw`
        SELECT barangay_id 
        FROM "BARANGAYS"
        WHERE ST_Within(
          ST_SetSRID(ST_MakePoint(${lng}::float, ${lat}::float), 4326),
          ST_GeomFromGeoJSON(boundary_geojson::text)
        )
        LIMIT 1;
      `;
      if (polygonMatch.length > 0 && polygonMatch[0].barangay_id) {
        return polygonMatch[0].barangay_id;
      }

      // 2. Parse address & auto-find or auto-create Barangay record dynamically
      const autoDetectedId = await this.parseAndGetBarangay(lat, lng, mapPinAddress);
      if (autoDetectedId) {
        return autoDetectedId;
      }

      // 3. Proximity check (Find closest Barangay dynamically based on pinned lat & lng)
      const closest = await prisma.$queryRaw`
        SELECT barangay_id 
        FROM "BARANGAYS"
        WHERE boundary_geojson IS NOT NULL
        ORDER BY ST_Distance(
          ST_SetSRID(ST_MakePoint(${lng}::float, ${lat}::float), 4326)::geography,
          ST_Centroid(ST_GeomFromGeoJSON(boundary_geojson::text))::geography
        ) ASC
        LIMIT 1;
      `;

      if (closest.length > 0 && closest[0].barangay_id) {
        return closest[0].barangay_id;
      }

      return null;
    } catch (error) {
      console.error('GeoService findBarangayByPoint Error:', error);
      return null;
    }
  },

  /**
   * Helper: Parse reverse geocoded address to find or create the exact Barangay in the DB
   */
  async parseAndGetBarangay(lat, lng, mapPinAddress = null) {
    try {
      let addressObj = null;
      let rawAddress = mapPinAddress || '';

      // If address is missing or incomplete, query Nominatim API dynamically
      if (!rawAddress || (!rawAddress.toLowerCase().includes('barangay') && !rawAddress.toLowerCase().includes('brgy'))) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'User-Agent': 'GAOIRS-App/1.0' } }
          );
          const data = await res.json();
          if (data && data.address) {
            addressObj = data.address;
            rawAddress = data.display_name || rawAddress;
          }
        } catch (e) {
          console.warn('GeoService reverse geocode fetch failed:', e.message);
        }
      }

      let brgyName = null;
      let municipality = null;

      if (addressObj) {
        brgyName = addressObj.suburb || addressObj.village || addressObj.quarter || addressObj.neighbourhood || addressObj.city_district || null;
        municipality = addressObj.city || addressObj.town || addressObj.municipality || addressObj.county || null;
      }

      // Fallback: parse raw address text
      const parts = (rawAddress || '').split(',').map(p => p.trim());
      if (!brgyName) {
        brgyName = parts.find(p => /^(barangay|brgy|bgy|zone|poblacion)/i.test(p)) || null;
      }
      if (!municipality) {
        const nirLguList = ['silay', 'talisay', 'victorias', 'cadiz', 'sagay', 'san carlos', 'bago', 'la carlota', 'himamaylan', 'kabankalan', 'sipalay', 'bacolod', 'murcia', 'e.b. magalona', 'magalona', 'manapla', 'pulupandan', 'san enrique', 'valladolid', 'pontevedra', 'hinigaran', 'binalbagan', 'isabela', 'moises padilla', 'la castellana', 'toboso', 'calatrava', 'candoni', 'cauayan', 'ilog', 'hinoba-an', 'salvador benedicto'];
        municipality = parts.find(p => nirLguList.some(c => p.toLowerCase().includes(c))) || null;
      }

      if (brgyName) {
        const cleanBrgy = brgyName.trim();
        const cleanMuni = (municipality || 'Negros Occidental').trim();

        // 1. Check if exact barangay exists in DB
        const existing = await prisma.barangay.findFirst({
          where: {
            name: { equals: cleanBrgy, mode: 'insensitive' },
            OR: [
              { municipality: { contains: cleanMuni, mode: 'insensitive' } },
              { city: { contains: cleanMuni, mode: 'insensitive' } }
            ]
          }
        });

        if (existing) {
          return existing.barangay_id;
        }

        // 2. Check if barangay matches by name alone
        const existingNameOnly = await prisma.barangay.findFirst({
          where: {
            name: { equals: cleanBrgy, mode: 'insensitive' }
          }
        });

        if (existingNameOnly) {
          return existingNameOnly.barangay_id;
        }

        // 3. Auto-create missing Barangay record in database for this municipality/city
        const newBrgy = await prisma.barangay.create({
          data: {
            name: cleanBrgy,
            municipality: cleanMuni,
            city: cleanMuni.toLowerCase().includes('city') ? cleanMuni : `${cleanMuni} City`,
            boundary_geojson: {}
          }
        });
        return newBrgy.barangay_id;
      }
    } catch (err) {
      console.error('parseAndGetBarangay error:', err);
    }
    return null;
  },

  /**
   * Find the nearest available response units to a given coordinate
   * Uses ST_Distance to compute meters between geographies
   */
  async findNearestUnits(lat, lng, limit = 5, unitType = null) {
    try {
      const typeFilter = unitType
        ? Prisma.sql`AND unit_type = ${unitType}::"UnitType"`
        : Prisma.sql``;

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
          AND unit_type = ${unitType}::"UnitType"
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
