# 🚀 GAOIRS Production Deployment Checklist

**Stage**: Pre-Launch
**Target Date**: After Testing Passes
**Effort**: 2-3 hours

---

##📋 Pre-Deployment Verification

### Code Quality
- [ ] All tests passing (see QUICK_START_TESTING.md)
- [ ] No console errors in browser DevTools
- [ ] No backend errors in server logs
- [ ] All API responses have proper status codes
- [ ] No hardcoded credentials in code
- [ ] No debug logging in production code

### Security
- [ ] All API endpoints require authentication
- [ ] Admin endpoints check for ADMIN role
- [ ] All sensitive data encrypted (passwords, API keys)
- [ ] CORS configured for production domain only
- [ ] SSL/TLS certificate installed
- [ ] Database backup automated & tested

### Performance
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Export generation < 5 seconds
- [ ] Database has proper indexes
- [ ] Image optimization enabled (Cloudinary)

---

## 🔐 Production Credentials Setup

### Firebase Production Credentials
```bash
# Obtain from Firebase Console:
FIREBASE_PROJECT_ID=gaoirs-66334          # Same as dev
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@gaoirs-66334.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n

# Actions:
- [ ] Generate new service account key (Firebase Console > Service Accounts)
- [ ] Add to production .env file
- [ ] Test with verify-firebase.sh
```

### SMTP Production Credentials
```bash
# Configure real email provider:
EMAIL_HOST=smtp.gmail.com              # or SendGrid, Postmark, etc.
EMAIL_PORT=587
EMAIL_USER=gaoirs@municipality.gov.ph
EMAIL_PASS=your-app-password           # Use app-specific password, not account password
EMAIL_FROM="GAOIRS <noreply@municipality.gov.ph>"

# Actions:
- [ ] Enable 2-factor authentication on email provider
- [ ] Generate app-specific password
- [ ] Test email delivery (System Settings > SMTP Server > Test)
- [ ] Verify SPF/DKIM/DMARC records with domain provider
```

### Twilio SMS Credentials
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Actions:
- [ ] Get production Twilio credentials (separate from dev)
- [ ] Verify phone number for production
- [ ] Set budget limits to prevent overspend
- [ ] Test SMS delivery (Alert Service logs)
```

### Cloudinary Image Hosting
```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Actions:
- [ ] Create production Cloudinary account
- [ ] Configure image optimization settings
- [ ] Set folder structure for automatic organization
- [ ] Enable delivery optimization
```

### Database Production Setup
```bash
DATABASE_URL="postgresql://username:password@prod-server:5432/gaoirs_db"
DIRECT_URL="postgresql://username:password@prod-server:5432/gaoirs_db"

# Actions:
- [ ] Create production PostgreSQL database
- [ ] Enable PostGIS extension: CREATE EXTENSION postgis;
- [ ] Run migrations: npx prisma migrate deploy
- [ ] Verify indexes are created
- [ ] Set up automated backups (daily)
```

### Secret Keys
```bash
JWT_SECRET="generate-a-new-32-char-random-string"
CONFIG_ENCRYPTION_KEY="generate-a-new-32-char-random-string"

# Actions:
- [ ] Generate cryptographically secure random strings (use: openssl rand -hex 16)
- [ ] Store in secure vault (not in git, use .env file)
- [ ] Rotate keys quarterly
```

---

## 🌐 Infrastructure Setup

### Domain & DNS
- [ ] Domain registered and configured
- [ ] DNS A records point to server IP
- [ ] MX records configured for email delivery
- [ ] SPF record configured: `v=spf1 include:sendgrid.net ~all`
- [ ] DKIM record configured (from email provider)
- [ ] DMARC record configured: `v=DMARC1; p=quarantine;`

### SSL/TLS Certificate
- [ ] SSL certificate installed (Let's Encrypt recommended, free)
- [ ] Certificate renewal automated (certbot with cron)
- [ ] HTTPS enforced (redirect HTTP to HTTPS)
- [ ] Certificate verified in browser (no warnings)

### Server Configuration
- [ ] Node.js LTS version installed (v20+)
- [ ] PostgreSQL 14+ installed
- [ ] Firewall configured (only ports 80, 443 open)
- [ ] Rate limiting enabled
- [ ] Fail2ban or similar DDoS protection
- [ ] SSH key-based authentication only (no passwords)

### Monitoring & Logging
- [ ] Error logging configured (e.g., Sentry, LogRocket)
- [ ] Performance monitoring enabled (e.g., New Relic)
- [ ] Database slow query log enabled
- [ ] Server resource monitoring (CPU, RAM, disk)
- [ ] Uptime monitoring (e.g., Pingdom, UptimeRobot)
- [ ] Alert notifications configured

---

## 📦 Code & Data Migration

### Backend Deployment
```bash
# On production server:
- [ ] Clone git repository
- [ ] Install dependencies: npm install
- [ ] Build if needed: npm run build
- [ ] Create .env file with production credentials
- [ ] Run migrations: npx prisma migrate deploy
- [ ] Start server: npm start (or use PM2 for process management)
- [ ] Verify server running on port 3001
- [ ] Test API: curl http://localhost:3001/api/health
```

### Frontend Deployment
```bash
# Option A: Static hosting (Vercel, Netlify, GitHub Pages)
- [ ] Build: npm run build
- [ ] Deploy dist/ folder to hosting
- [ ] Configure production domain
- [ ] Verify API calls use production backend URL

# Option B: Self-hosted
- [ ] Build: npm run build
- [ ] Copy dist/ to web server
- [ ] Configure nginx/Apache to serve static files
- [ ] Set up reverse proxy to backend API
- [ ] Enable gzip compression
```

### Mobile App Updates
```bash
# iOS/Android Builds
- [ ] Update API_URL to production backend
- [ ] Update Firebase project ID for production
- [ ] Generate production signing keys
- [ ] Build APK/AAB for Android: eas build --platform android --type apk
- [ ] Build IPA for iOS: eas build --platform ios
- [ ] Test on physical devices
- [ ] Submit to Google Play & Apple App Store
- [ ] Wait for review & approval (~1-3 days)
```

### Database Seeding
```bash
- [ ] Seed incident types with proper colors & icons
- [ ] Create admin user account
- [ ] Add initial LGU jurisdictions (municipalities & barangays)
- [ ] Configure default system settings
- [ ] Create sample response units for testing
```

---

## ✅ Production Testing

### API Endpoints
- [ ] Test all 20+ API endpoints with production credentials
- [ ] Test authentication flow (login, logout, token refresh)
- [ ] Test authorization (admin only features)
- [ ] Test error handling (invalid input, server errors)
- [ ] Test rate limiting

### User Workflows
- [ ] Complete incident reporting flow (web, mobile)
- [ ] Verify dispatch assignment works
- [ ] Test push notification delivery
- [ ] Test PDF/Excel export
- [ ] Test system settings updates
- [ ] Test offline incident queueing

### Performance
- [ ] Load test with 100 concurrent users (Apache JMeter, k6)
- [ ] Monitor response times
- [ ] Check database query performance
- [ ] Verify caching is working
- [ ] Test under network throttle conditions

### Data Integrity
- [ ] Verify incident data saves correctly
- [ ] Verify evidence photos upload & display
- [ ] Verify geolocations are accurate
- [ ] Verify audit logs record all actions
- [ ] Run database consistency checks

---

## 🚨 Monitoring & Alerts Setup

### Application Monitoring
```bash
# Set up alerts for:
- [ ] API error rate > 1%
- [ ] Response time > 2 seconds
- [ ] Database connection errors
- [ ] Firebase/Twilio/Email service failures
- [ ] Disk space < 10% remaining
- [ ] Memory usage > 80%
- [ ] CPU usage > 90%
```

### Notification Channels
- [ ] Email alerts configured
- [ ] Slack webhook for team notifications
- [ ] PagerDuty for on-call rotation (if team)
- [ ] SMS alerts for critical issues

### Log Aggregation
- [ ] Centralized logging service configured
- [ ] Searchable error logs
- [ ] Debug logs disabled in production
- [ ] Security event logs reviewed daily

---

## 🔄 Continuous Deployment Setup (Optional)

### GitHub Actions / CI/CD
- [ ] GitHub Actions workflow configured
- [ ] Tests run automatically on push
- [ ] Code style checks enabled
- [ ] Automatic deployment on merge to main
- [ ] Rollback procedure documented

---

## 🎉 Launch Checklist

### Final Verification (Day Of Launch)
- [ ] All team members aware of launch
- [ ] Database backup taken (just in case)
- [ ] Rollback procedure documented & tested
- [ ] Support team ready (phone, email)
- [ ] Monitoring dashboard open & watched
- [ ] Analytics events firing correctly
- [ ] Error tracking service active

### Launch Steps
- [ ] Deploy backend to production
- [ ] Deploy frontend to production
- [ ] Activate database migrations
- [ ] Run smoke tests in production
- [ ] Update mobile app in app stores
- [ ] Announce launch on social media
- [ ] Monitor errors & performance for 24 hours

### Post-Launch (First Week)
- [ ] Monitor error logs daily
- [ ] Respond to user feedback
- [ ] Optimize performance if needed
- [ ] Security review of production environment
- [ ] Create post-launch report

---

## 📋 Rollback Procedure (If Needed)

```bash
# If critical issue discovered:
1. [ ] Stop new traffic to production
2. [ ] Revert to last known good deployment
3. [ ] Restore database from backup if needed
4. [ ] Test rollback thoroughly
5. [ ] Communicate status to stakeholders
6. [ ] Post-mortem on what went wrong
```

---

## 📞 Emergency Contacts

Add team contact info:
```
Technical Lead: __________________ Phone: ____________
Database Admin: __________________ Phone: ____________
DevOps/Deployment: ______________ Phone: ____________
Support Manager: ________________ Phone: ____________
```

---

## ✅ Sign-Off

Project Manager: ________________ Date: __________

Technical Lead: ________________ Date: __________

All items checked: ✅ Yes / ⏳ In Progress / ❌ Blocked

---

## 📚 Reference Documents
- FEATURE_TEST_PLAN.md - Feature validation
- QUICK_START_TESTING.md - Testing guide
- IMPLEMENTATION_SUMMARY.md - What was built
- Backend README.md - Backend setup guide
- Frontend README.md - Frontend setup guide
- Reporter App setup - Mobile deployment guide

---

**Status**: Ready to deploy after testing passes
**Next**: Execute testing → Fix issues → Follow this checklist → Launch!
