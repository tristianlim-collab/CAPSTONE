-- Enable PostGIS for geospatial functionality
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;

-- DROP EXISTING TABLES AND TYPES TO PREVENT "ALREADY EXISTS" ERRORS
DROP TABLE IF EXISTS "analytics_cache" CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "assignments" CASCADE;
DROP TABLE IF EXISTS "incident_updates" CASCADE;
DROP TABLE IF EXISTS "incidents" CASCADE;
DROP TABLE IF EXISTS "response_units" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "barangays" CASCADE;

DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "IncidentType" CASCADE;
DROP TYPE IF EXISTS "IncidentStatus" CASCADE;
DROP TYPE IF EXISTS "ResponseUnitStatus" CASCADE;
DROP TYPE IF EXISTS "AssignmentStatus" CASCADE;

-- Create ENUM types
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'RESPONDER', 'RESIDENT');
CREATE TYPE "IncidentType" AS ENUM ('FIRE', 'ROAD_ACCIDENT', 'CRIME', 'MEDICAL', 'OTHER');
CREATE TYPE "IncidentStatus" AS ENUM ('REPORTED', 'VERIFIED', 'RESPONDING', 'RESOLVED', 'CLOSED');
CREATE TYPE "ResponseUnitStatus" AS ENUM ('AVAILABLE', 'ON_CALL', 'OFF_DUTY');
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED');

-- Create "barangays" table
CREATE TABLE "barangays" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jurisdiction" TEXT,
    "boundary" geometry(Polygon, 4326),

    CONSTRAINT "barangays_pkey" PRIMARY KEY ("id")
);

-- Create "users" table
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'RESIDENT',
    "barangay_id" TEXT,
    "phone_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Create "response_units" table
CREATE TABLE "response_units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "IncidentType" NOT NULL,
    "location" geometry(Point, 4326),
    "status" "ResponseUnitStatus" NOT NULL DEFAULT 'OFF_DUTY',
    "jurisdiction_id" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "response_units_pkey" PRIMARY KEY ("id")
);

-- Create "incidents" table
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "incident_code" TEXT NOT NULL,
    "type" "IncidentType" NOT NULL,
    "description" TEXT,
    "photo_url" TEXT,
    "coordinates" geometry(Point, 4326) NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'REPORTED',
    "barangay_id" TEXT,
    "reporter_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- Create "incident_updates" table
CREATE TABLE "incident_updates" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "update_text" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_updates_pkey" PRIMARY KEY ("id")
);

-- Create "assignments" table
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "responded_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- Create "notifications" table
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "incident_id" TEXT,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- Create "analytics_cache" table
CREATE TABLE "analytics_cache" (
    "id" TEXT NOT NULL,
    "metric_key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_cache_pkey" PRIMARY KEY ("id")
);

-- Setup Unique constraints
CREATE UNIQUE INDEX "barangays_name_key" ON "barangays"("name");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "response_units_name_key" ON "response_units"("name");
CREATE UNIQUE INDEX "response_units_user_id_key" ON "response_units"("user_id");
CREATE UNIQUE INDEX "incidents_incident_code_key" ON "incidents"("incident_code");
CREATE UNIQUE INDEX "analytics_cache_metric_key_key" ON "analytics_cache"("metric_key");

-- Add typical indexes
CREATE INDEX "incidents_status_idx" ON "incidents"("status");
CREATE INDEX "incidents_type_idx" ON "incidents"("type");
CREATE INDEX "incidents_created_at_idx" ON "incidents"("created_at");
CREATE INDEX "incident_updates_incident_id_idx" ON "incident_updates"("incident_id");

-- Foreign key links (Foreign Keys)
ALTER TABLE "users" ADD CONSTRAINT "users_barangay_id_fkey" FOREIGN KEY ("barangay_id") REFERENCES "barangays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "response_units" ADD CONSTRAINT "response_units_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "response_units" ADD CONSTRAINT "response_units_jurisdiction_id_fkey" FOREIGN KEY ("jurisdiction_id") REFERENCES "barangays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_barangay_id_fkey" FOREIGN KEY ("barangay_id") REFERENCES "barangays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "incident_updates" ADD CONSTRAINT "incident_updates_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "incident_updates" ADD CONSTRAINT "incident_updates_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "assignments" ADD CONSTRAINT "assignments_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "response_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert Bacolod Barangays so incident reporting works natively
INSERT INTO "barangays" ("id", "name", "jurisdiction", "boundary") 
VALUES 
(gen_random_uuid(), 'Mandalagan', 'Bacolod City, Negros Occidental', NULL),
(gen_random_uuid(), 'Villamonte', 'Bacolod City, Negros Occidental', NULL),
(gen_random_uuid(), 'Banago', 'Bacolod City, Negros Occidental', NULL),
(gen_random_uuid(), 'Tangub', 'Bacolod City, Negros Occidental', NULL),
(gen_random_uuid(), 'Estefania', 'Bacolod City, Negros Occidental', NULL)
ON CONFLICT ("name") DO NOTHING;