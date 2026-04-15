#!/bin/bash

echo "🐳 Starting PostgreSQL with PostGIS using Docker..."
echo ""

# Start PostgreSQL container
docker-compose up -d

echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

echo ""
echo "✅ PostgreSQL is running!"
echo ""
echo "📋 Database Credentials:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: gaoirs_db"
echo "   Username: postgres"
echo "   Password: postgres"
echo ""
echo "🔄 Now run: npm run setup"
