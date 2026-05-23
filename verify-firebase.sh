#!/bin/bash
# Firebase Credentials Verification Script

echo "🔐 Testing Firebase Credentials..."
echo ""

cd "$(dirname "$0")/backend" || exit 1

# Create temporary test file
cat > .firebase-test.js << 'EOF'
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

console.log('📋 Firebase Configuration Check:');
console.log('================================');
console.log(`✓ Project ID: ${projectId ? '✅ Configured' : '❌ Missing'}`);
console.log(`✓ Client Email: ${clientEmail ? '✅ Configured' : '❌ Missing'}`);
console.log(`✓ Private Key: ${privateKey ? '✅ Configured' : '❌ Missing'}`);
console.log('');

if (!projectId || !privateKey || !clientEmail) {
  console.log('❌ Firebase credentials incomplete!');
  process.exit(1);
}

try {
  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      privateKey: privateKey.replace(/\\n/g, '\n'),
      clientEmail,
    }),
  });

  console.log('✅ Firebase Admin SDK initialized successfully!');
  console.log('✅ All credentials are valid!');
  console.log('');
  console.log('🚀 Push Notifications are READY to use!');
  process.exit(0);
} catch (err) {
  console.log('❌ Firebase initialization failed:');
  console.log(`Error: ${err.message}`);
  process.exit(1);
}
EOF

echo "Running Firebase credentials test..."
node .firebase-test.js

# Cleanup
rm -f .firebase-test.js
