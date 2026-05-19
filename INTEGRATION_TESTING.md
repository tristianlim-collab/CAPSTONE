# Integration Testing Guide

## ✅ System Status Check

### 1. ML Service Health
```bash
curl http://localhost:5000/api/health
```
Expected: `{"status":"healthy",...}`

### 2. Backend Running
```bash
curl http://localhost:3001/api/analytics/summary
```
Expected: Auth error (401) means backend is running and protecting endpoints ✓

### 3. ML Service → Backend Integration
```bash
# Get a valid JWT token from the frontend (saved in localStorage)
# Then make this request with the token:

curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/analytics/forecast/7?model=sarima
```

---

## 📊 Complete Integration Flow

```
┌─────────────────┐
│  User Action    │
│ Click "Refresh" │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Frontend (React)               │
│  TrendForecast Component        │
│  fetch('/api/analytics/...')    │
└────────┬────────────────────────┘
         │ (with Bearer token)
         ▼
┌────────────────────────────────┐
│  Backend (Node.js)             │
│  Analytics Controller          │
│  getForecast()                 │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  Prediction Service            │
│  axios.get(ML_SERVICE_URL/...) │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  ML Service (Node.js)          │
│  /api/predict/7               │
│  ├─ SARIMA algorithm           │
│  ├─ Generate synthetic data    │
│  └─ Calculate metrics          │
└────────┬───────────────────────┘
         │
         ▼
│ JSON Response: predictions,  │
│ dates, accuracy_metrics      │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  Backend Response              │
│  Returns wrapped JSON          │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  Frontend Component            │
│  ├─ Parse response            │
│  ├─ Format chart data         │
│  ├─ Calculate statistics      │
│  └─ Render UI                 │
└────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### Test 1: Direct ML Service Call
```bash
# SARIMA 7-day forecast
curl -s http://localhost:5000/api/predict/7?model=sarima | jq .

# Response includes:
# - predictions: [15, 15, 15, 11, 9, 11, 12]
# - dates: ["2026-05-19", "2026-05-20", ...]
# - accuracy_metrics: {aic, bic, rmse}
```

### Test 2: Prophet with Confidence Intervals
```bash
curl -s "http://localhost:5000/api/predict/14?model=prophet&include_ci=true" | jq .

# Response includes:
# - predictions: [...]
# - dates: [...]
# - upper_ci: [...] (confidence upper bound)
# - lower_ci: [...] (confidence lower bound)
```

### Test 3: Model Comparison
```bash
curl -s http://localhost:5000/api/models/comparison | jq .

# Shows:
# - SARIMA: champion model
#   - AIC: 234.56
#   - BIC: 245.67
#   - RMSE: 2.45 (lowest)
# - Prophet
# - Moving Average
```

### Test 4: Backend → ML Service (Requires Auth)
```bash
# First, get a token from the frontend by logging in
# Save it as: export TOKEN="your_token_here"

curl -H "Authorization: Bearer $TOKEN" \
  -s http://localhost:3001/api/analytics/forecast/7?model=sarima | jq .

# If auth fails, backend will return 401
# If ML service fails, backend will return error message
```

### Test 5: Frontend Integration
1. Go to `http://localhost:5173`
2. Login with any admin credentials
3. Click on **Admin** in sidebar
4. Select **Analytics**
5. Look for **"Trend Forecast"** section
6. Should see:
   - Area chart with 7-day predictions
   - Statistics cards (Avg, Trend %, Peak, Low)
   - Model dropdown selector
   - Model comparison table

---

## 📈 Expected Output Examples

### SARIMA Forecast Response
```json
{
  "success": true,
  "days_ahead": 7,
  "predictions": {
    "sarima": {
      "predictions": [15, 15, 15, 11, 9, 11, 12],
      "dates": [
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-23",
        "2026-05-24",
        "2026-05-25"
      ],
      "model_type": "SARIMA",
      "accuracy_metrics": {
        "aic": 234.56,
        "bic": 245.67,
        "rmse": 2.45
      }
    }
  },
  "timestamp": "2026-05-18T15:20:19.381Z",
  "note": "Using synthetic data for demonstration"
}
```

### Frontend Chart Data (After Processing)
```json
[
  {
    "date": "May 19",
    "fullDate": "2026-05-19",
    "predicted": 15,
    "index": 0
  },
  {
    "date": "May 20",
    "fullDate": "2026-05-20",
    "predicted": 15,
    "index": 1
  }
  // ... more data points
]
```

### Frontend Statistics (Calculated)
```json
{
  "avg": 13,           // Average of all predictions
  "trend": -1,         // Last value - First value
  "trendPercent": -7,  // Percentage change
  "max": 15,           // Peak day
  "min": 9             // Low day
}
```

---

## 🔍 Debugging Checklist

### If ML Service fails:
- [ ] Port 5000 is available: `lsof -i :5000`
- [ ] Node.js running: `ps aux | grep node`
- [ ] Dependencies installed: `cd ml-service && npm install`
- [ ] Start service: `npm start`

### If Backend can't connect to ML Service:
- [ ] `ML_SERVICE_URL` env var is set correctly
- [ ] ML Service is actually running on port 5000
- [ ] Network allows localhost communication
- [ ] Check backend logs for connection errors

### If Frontend shows error:
- [ ] User is authenticated (has valid JWT token)
- [ ] Backend is running on port 3001
- [ ] No CORS errors in browser console
- [ ] Browser DevTools Network tab shows requests

### If data looks weird:
- [ ] Using synthetic data? That's expected (demo)
- [ ] Check `/api/stats` for service info
- [ ] Try `/api/models/comparison` to verify models

---

## 🚀 Quick Test Commands

Run these from CAPSTONE root directory:

```bash
# Test 1: ML Service only
curl http://localhost:5000/api/predict/7?model=sarima

# Test 2: ML Service comparison
curl http://localhost:5000/api/models/comparison

# Test 3: Check all services running
echo "=== ML Service ===" && curl -s http://localhost:5000/api/health | head -c 50
echo -e "\n=== Backend ===" && curl -s http://localhost:3001/api/analytics/summary | head -c 50
echo -e "\n=== Frontend ===" && curl -s http://localhost:5173 | head -c 50
```

---

## 📋 Verification Checklist

- [ ] ML Service running on port 5000 (responds to /api/health)
- [ ] Backend running on port 3001 (responds to /api/analytics/*)
- [ ] Frontend running on port 5173 (loads /admin/analytics)
- [ ] Can see TrendForecast component on Analytics page
- [ ] Chart displays 7-day forecast
- [ ] Model selector works (SARIMA/Prophet)
- [ ] Statistics cards show values
- [ ] Model comparison table visible
- [ ] No errors in browser console
- [ ] No errors in backend logs

---

## 🎯 Success Criteria

✅ **System is working when:**
1. ML Service responds to `/api/predict/*` requests
2. Backend redirects to ML Service for forecast data
3. Frontend displays interactive forecast chart
4. Model comparison shows SARIMA as champion
5. Statistics update when changing model/days
6. No errors in any logs

**If all items are checked, your ML Service integration is complete! 🎉**
