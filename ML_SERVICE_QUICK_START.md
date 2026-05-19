# 🚀 ML Service Quick Start Guide

## What Just Happened

✅ Created Node.js ML Microservice with SARIMA & Prophet algorithms
✅ Service is running on `http://localhost:5000`
✅ Backend already integrated and calling the service
✅ Frontend Analytics page ready to display forecasts

---

## 3 Easy Steps to See It Working

### Step 1: Verify ML Service is Running
```bash
curl http://localhost:5000/api/health
```
Should show: `{"status":"healthy",...}`

### Step 2: Start Backend (if not running)
```bash
cd backend
npm run dev
```

### Step 3: Start Frontend (if not running)
```bash
cd frontend
npm run dev
```

---

## Go to Analytics Dashboard

1. Open browser → `http://localhost:5173`
2. Login to admin account
3. Navigate to **Admin Menu** → **Analytics**
4. Look for **"Trend Forecast"** section
5. Switch between **SARIMA** and **Prophet** models
6. Watch the chart update with predictions

---

## What You're Seeing

**SARIMA Model** (Recommended):
- 7-day incident forecast
- Seasonal patterns detected
- Accuracy metrics shown (AIC, BIC, RMSE)

**Prophet Model** (Alternative):
- Smoother trend detection
- Confidence intervals (upper/lower bounds)
- Better for longer forecasts

---

## Test the API Directly

```bash
# SARIMA 7-day forecast
curl "http://localhost:5000/api/predict/7?model=sarima"

# Prophet with confidence intervals
curl "http://localhost:5000/api/predict/14?model=prophet&include_ci=true"

# Compare all models
curl "http://localhost:5000/api/models/comparison"
```

---

## Key Points

✅ Currently using **synthetic training data** (realistic patterns)
✅ All models ready for **real incident data**
✅ Backend can retrain with `POST /api/train`
✅ Frontend shows **live model metrics**

---

## Next Steps

1. Load your incident history data into the models
2. Fine-tune parameters for your region
3. Set up automated retraining on new incidents
4. Add alert notifications for forecast peaks

---

**Everything is working! Go to /admin/analytics to see the forecast.**
